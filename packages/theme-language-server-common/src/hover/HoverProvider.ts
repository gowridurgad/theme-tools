import { Hover, HoverParams } from 'vscode-languageserver';
import { LiquidHtmlNode, SourceCodeType, ThemeDocset } from '@shopify/theme-check-common';
import { DocumentManager } from '../documents';
import { forEachChildNodes } from '../visitor';
import { TypeSystem } from '../TypeSystem';
import { BaseHoverProvider } from './BaseHoverProvider';
import { LiquidFilterHoverProvider, LiquidTagHoverProvider } from './providers';

export class HoverProvider {
  private providers: BaseHoverProvider[] = [];

  constructor(readonly documentManager: DocumentManager, readonly themeDocset: ThemeDocset) {
    const typeSystem = new TypeSystem(themeDocset);
    this.providers = [
      new LiquidTagHoverProvider(themeDocset),
      new LiquidFilterHoverProvider(themeDocset),
      // new HtmlTagCompletionProvider(),
      // new HtmlAttributeCompletionProvider(),
      // new LiquidTagsCompletionProvider(themeDocset),
      // new ObjectCompletionProvider(themeDocset),
      // new ObjectAttributeCompletionProvider(themeDocset),
      // new AssignmentsCompletionProvider(themeDocset),
      // new FilterCompletionProvider(themeDocset),
      // new RenderSnippetCompletionProvider(themeDocset),
    ];
  }

  async hover(params: HoverParams): Promise<Hover | null> {
    const uri = params.textDocument.uri;
    const document = this.documentManager.get(uri);

    // Supports only Liquid resources
    if (document?.type !== SourceCodeType.LiquidHtml || document.ast instanceof Error) {
      return null;
    }

    const [currentNode, ancestors] = findCurrentNode(
      document.ast,
      document.textDocument.offsetAt(params.position),
    );

    const promises = this.providers.map((p) => p.hover(params, currentNode, ancestors));
    const results = await Promise.all(promises);
    return results.find(Boolean) ?? null;
  }
}

function findCurrentNode(
  ast: LiquidHtmlNode,
  cursorPosition: number,
): [node: LiquidHtmlNode, ancestors: LiquidHtmlNode[]] {
  let prev: LiquidHtmlNode | undefined;
  let current: LiquidHtmlNode = ast;
  let ancestors: LiquidHtmlNode[] = [];

  while (current !== prev) {
    prev = current;
    forEachChildNodes<SourceCodeType.LiquidHtml>(
      current,
      ancestors.concat(current),
      (child, lineage) => {
        if (isCovered(child, cursorPosition) && size(child) <= size(current)) {
          current = child;
          ancestors = lineage;
        }
      },
    );
  }

  return [current, ancestors];
}

function isCovered(node: LiquidHtmlNode, offset: number): boolean {
  return node.position.start <= offset && offset <= node.position.end;
}

function size(node: LiquidHtmlNode): number {
  return node.position.end - node.position.start;
}