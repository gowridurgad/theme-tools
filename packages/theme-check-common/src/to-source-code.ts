import { toLiquidHtmlAST } from '@shopify/liquid-html-parser';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  ArrayNode,
  IdentifierNode,
  LiteralNode,
  ObjectNode,
  PropertyNode,
  ValueNode,
} from 'json-to-ast';
import { parseTree, ParseError, Node as JSONCNode, printParseErrorCode } from 'jsonc-parser';

import { SourceCodeType, JSONSourceCode, LiquidSourceCode, JSONNode } from './types';
export { printParseErrorCode };

function asError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  } else if (typeof error === 'string') {
    return new Error(error);
  } else if (error && typeof error.toString === 'function') {
    return new Error(error.toString());
  } else {
    return new Error('An unknown error occurred');
  }
}

function parseLiquid(source: string) {
  try {
    return toLiquidHtmlAST(source);
  } catch (error) {
    return asError(error);
  }
}

type BJSONCNode = JsonCObjectNode | JsonCPropertyNode | JsonCLiteralNode | JsonCArrayNode;
type JsonCValueNode = JsonCObjectNode | JsonCLiteralNode | JsonCArrayNode;

interface JsonCObjectNode extends JSONCNode {
  length: number;
  offset: number;
  children: JsonCPropertyNode[];
  type: 'object';
}

interface JsonCPropertyNode extends JSONCNode {
  length: number;
  offset: number;
  colonOffset: number;
  parent: JsonCObjectNode;
  children: JsonCLiteralNode[];
  type: 'property';
}

interface JsonCLiteralNode extends JSONCNode {
  length: number;
  offset: number;
  parent: JsonCPropertyNode;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'null';
}

interface JsonCArrayNode extends JSONCNode {
  type: 'array';
  children: JsonCValueNode[];
}

export class JSONCError extends Error {
  constructor(public readonly errors: ParseError[]) {
    const errorString = errors.map((error) => printParseErrorCode(error.error)).join('\n');
    super(errorString);
    this.name = 'JSONCError';
    this.errors = errors;
  }
}

function parseJSON(source: string): JSONNode | Error {
  try {
    const errors: ParseError[] = [];
    const tree = parseTree(source, errors, { allowTrailingComma: true });
    if (errors.length !== 0 || tree === undefined) {
      // Only surfacing the first error for now
      // create a massive error message by concat all the errors (join)
      return asError(new JSONCError(errors));
    }
    const doc = TextDocument.create('file:///', 'json', 0, source);
    return transform(tree as BJSONCNode, doc);
  } catch (error) {
    return asError(error);
  }
}

function transform(tree: BJSONCNode, doc: TextDocument): JSONNode {
  switch (tree.type) {
    case 'object':
      return objectNode(tree as JsonCObjectNode, doc);
    case 'property':
      return propertyNode(tree as JsonCPropertyNode, doc);
    case 'array':
      return arrayNode(tree as JsonCArrayNode, doc);
    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
      return literalNode(tree as JsonCLiteralNode, doc);
    default: {
      return {
        type: 'Literal',
        value: 'fallback value',
        raw: 'raw fallback value',
        loc: loc(tree, doc),
      } as LiteralNode;
    }
  }
}

function loc(node: BJSONCNode, doc: TextDocument): JSONNode['loc'] {
  const start = doc.positionAt(node.offset);
  const end = doc.positionAt(node.offset + node.length);
  return {
    start: {
      line: start.line,
      column: start.character,
      offset: node.offset,
    },
    end: {
      line: end.line,
      column: end.character,
      offset: node.offset + node.length,
    },
    source: null,
  };
}

function arrayNode(tree: JsonCArrayNode, doc: TextDocument): ArrayNode {
  return {
    type: 'Array',
    children: tree.children.map((child) => transform(child, doc)) as ValueNode[],
    loc: loc(tree, doc),
  };
}

function objectNode(tree: JsonCObjectNode, doc: TextDocument): ObjectNode {
  return {
    type: 'Object',
    children: tree.children.map((child) => transform(child, doc)) as PropertyNode[],
    loc: loc(tree, doc),
  };
}

function literalNode(tree: JsonCLiteralNode, doc: TextDocument): LiteralNode {
  return {
    type: 'Literal',
    value: tree.value,
    raw: `"${tree.value.toString()}"`,
    loc: loc(tree, doc),
  };
}

function propertyNode(node: JsonCPropertyNode, doc: TextDocument): PropertyNode {
  return {
    type: 'Property',
    key: identifierNode(node.children![0] as JsonCLiteralNode, doc),
    value: transform(node.children![1] as JsonCLiteralNode, doc) as ValueNode,
    loc: loc(node, doc),
  };
}

function identifierNode(node: JsonCLiteralNode, doc: TextDocument): IdentifierNode {
  return {
    type: 'Identifier',
    value: node.value,
    raw: `"${node.value}"`,
    loc: loc(node, doc),
  };
}

export function toSourceCode(
  absolutePath: string,
  source: string,
  version?: number,
): LiquidSourceCode | JSONSourceCode {
  const isLiquid = absolutePath.endsWith('.liquid');

  if (isLiquid) {
    return {
      absolutePath,
      source,
      type: SourceCodeType.LiquidHtml,
      ast: parseLiquid(source),
      version,
    };
  } else {
    return {
      absolutePath,
      source,
      type: SourceCodeType.JSON,
      ast: parseJSON(source),
      version,
    };
  }
}
