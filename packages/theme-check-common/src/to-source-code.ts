import { toLiquidHtmlAST } from '@shopify/liquid-html-parser';
import toJSON, {
  ArrayNode,
  IdentifierNode,
  LiteralNode,
  ObjectNode,
  PropertyNode,
  ValueNode,
} from 'json-to-ast';
import { parseTree, ParseError, Node as JSONCNode } from 'jsonc-parser';

import { SourceCodeType, JSONSourceCode, LiquidSourceCode, JSONNode } from './types';

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

function parseJSON(source: string): JSONNode | Error {
  try {
    const errors: ParseError[] = [];
    const tree = parseTree(source, errors, { allowTrailingComma: true });
    if (errors.length !== 0 || tree === undefined) {
      // Only surfacing the first error for now
      return asError(errors[0]);
    }
    return transform(tree as BJSONCNode);
  } catch (error) {
    return asError(error);
  }
}

// todo: calculate location properly (column, offset, etc)
function transform(tree: BJSONCNode): JSONNode {
  switch (tree.type) {
    case 'object':
      return objectNode(tree as JsonCObjectNode);
    case 'property':
      return propertyNode(tree as JsonCPropertyNode);
    case 'array':
      return arrayNode(tree as JsonCArrayNode);
    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
      return literalNode(tree as JsonCLiteralNode);
    default: {
      return {
        type: 'Literal',
        value: 'fallback value',
        raw: 'raw fallback value',
      };
    }
  }
}

function arrayNode(tree: JsonCArrayNode): ArrayNode {
  return {
    type: 'Array',
    children: tree.children.map(transform) as ValueNode[],
  };
}

function objectNode(tree: JsonCObjectNode): ObjectNode {
  return {
    type: 'Object',
    children: tree.children.map(transform) as PropertyNode[],
  };
}

function literalNode(tree: JSONCNode): LiteralNode {
  return {
    type: 'Literal',
    value: tree.value,
    raw: `"${tree.value.toString()}"`,
  };
}

function propertyNode(node: JsonCPropertyNode): PropertyNode {
  return {
    type: 'Property',
    key: identifierNode(node.children![0] as JSONCNode),
    value: transform(node.children![1] as JsonCLiteralNode) as ValueNode,
  };
}

function identifierNode(node: JSONCNode): IdentifierNode {
  return {
    type: 'Identifier',
    value: node.value,
    raw: `"${node.value}"`,
  };
}

// FOR REFERENCE

// function toJsonToAstASt(jsonDoc: JSONDocument): JSONNode {
//   const ast = jsonDoc.root;
//   return astNodeToJsonToAstAst(ast);
// }

// function astNodeToJsonToAstAst(astNode: ASTNode): JSONNode {
//   switch (astNode.type) {
//     case 'object':
//       return objectToObjectNode(astNode);
//     case 'array':
//       return {
//         type: 'array',
//         children: astNode.items.map(astNodeToJsonToAstAst),
//       };
//     case 'string':
//       return {
//         type: 'string',
//         value: astNode.value,
//       };
//     case 'number':
//       return {
//         type: 'number',
//         value: astNode.value,
//       };
//     case 'boolean':
//       return {
//         type: 'boolean',
//         value: astNode.value,
//       };
//     case 'null':
//       return {
//         type: 'null',
//       };
//   }
// }

// function objectToObjectNode(astNode: ObjectASTNode): ObjectNode {
//   return {
//     type: 'object',
//     children: astNode.properties.map((property) => propertyToPropertyNode(property)),
//   };
// }

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
