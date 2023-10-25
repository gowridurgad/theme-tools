import { EditorView, Decoration, DecorationSet, PluginValue } from '@codemirror/view';
import { StateField, StateEffect, Facet } from '@codemirror/state';
import { DocumentLink, DocumentLinkRequest } from 'vscode-languageserver-protocol';
import { ViewPlugin, ViewUpdate } from '@codemirror/view';
import { clientFacet, fileUriFacet } from './client';
import { textDocumentField, textDocumentSync } from './textDocumentSync';

export type OnDocumentLinkClick = (documentLink: DocumentLink['target']) => void;
export const onDocumentLinkClickFacet = Facet.define<
  OnDocumentLinkClick | undefined,
  OnDocumentLinkClick | undefined
>({
  combine: (values) => values[0] ?? undefined,
});

async function getLinks(view: EditorView) {
  // Get the LSP client and the TextDocument
  const client = view.state.facet(clientFacet.reader);
  const textDocument = view.state.field(textDocumentField);
  const fileURI = view.state.facet(fileUriFacet.reader);

  // Send the documentLink request to the LSP server
  const links = await client.sendRequest(DocumentLinkRequest.type, {
    textDocument: { uri: fileURI },
    partialResultToken: undefined,
  });

  if (!links) return Decoration.none;

  // Create decorations for the document links
  const decorations = links.map((link) => {
    const from = textDocument.offsetAt(link.range.start);
    const to = textDocument.offsetAt(link.range.end);
    const mark = Decoration.mark({
      tagName: 'a',
      class: 'cm-link',
      attributes: {
        'data-link-id': link.target || '',
      },
    });
    return mark.range(from, to);
  });

  return Decoration.set(decorations);
}

class DocumentLinksPlugin implements PluginValue {
  decorations: DecorationSet = Decoration.none;

  constructor(view: EditorView) {
    this.updateLinks(view);
  }

  async update(update: ViewUpdate) {
    if (!update.docChanged) {
      return;
    }
    this.updateLinks(update.view);
  }

  async updateLinks(view: EditorView) {
    this.decorations = await getLinks(view);
  }
}

const documentLinksPlugin = ViewPlugin.fromClass(DocumentLinksPlugin, {
  decorations: (plugin) => plugin.decorations,
  eventHandlers: {
    // there is one handler for the entire instance
    click(event, view) {
      // need to early return if i'm not clicking on a decorated document link
      const target = event.target;
      if (!isTargetAnHTMLElement(target)) {
        return;
      }
      // need a way to figure out if I'm clicking on a decoreated coducmelkasd
      // need a way to find the document link object for the document link under the cursor
      const onDocumentLinkClick = view.state.facet(onDocumentLinkClickFacet.reader);
      if (!onDocumentLinkClick) return;

      if (!target.dataset.linkId) return;
      onDocumentLinkClick(target.dataset.linkId);
    },
  },
});

function isTargetAnHTMLElement(target: EventTarget | null): target is HTMLElement {
  return !!target && 'dataset' in target;
}

// Define the document links extension
export const docLinksExtension = (onDocumentLinkClick: OnDocumentLinkClick | undefined) => {
  return [onDocumentLinkClickFacet.of(onDocumentLinkClick), documentLinksPlugin];
};
