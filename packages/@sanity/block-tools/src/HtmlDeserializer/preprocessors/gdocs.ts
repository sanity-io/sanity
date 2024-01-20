import {type HtmlPreprocessorOptions} from '../../types'
import {normalizeWhitespace, removeAllWhitespace, tagName} from '../helpers'
import {_XPathResult} from './xpathResult'

export default (html: string, doc: Document, options: HtmlPreprocessorOptions): Document => {
  const whitespaceOnPasteMode = options?.unstable_whitespaceOnPasteMode || 'preserve'
  let gDocsRootOrSiblingNode = doc
    .evaluate(
      '//*[@id and contains(@id, "docs-internal-guid")]',
      doc,
      null,
      _XPathResult.ORDERED_NODE_ITERATOR_TYPE,
      null,
    )
    .iterateNext()

  if (gDocsRootOrSiblingNode) {
    const isWrappedRootTag = tagName(gDocsRootOrSiblingNode) === 'b'

    // If this document isn't wrapped in a 'b' tag, then assume all siblings live on the root level
    if (!isWrappedRootTag) {
      gDocsRootOrSiblingNode = doc.body
    }

    switch (whitespaceOnPasteMode) {
      case 'normalize':
        // Keep only 1 empty block between content nodes
        normalizeWhitespace(gDocsRootOrSiblingNode)
        break
      case 'remove':
        // Remove all whitespace nodes
        removeAllWhitespace(gDocsRootOrSiblingNode)
        break
      default:
        break
    }

    // Tag every child with attribute 'is-google-docs' so that the GDocs rule-set can
    // work exclusivly on these children
    const childNodes = doc.evaluate(
      '//*',
      doc,
      null,
      _XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
      null,
    )

    for (let i = childNodes.snapshotLength - 1; i >= 0; i--) {
      const elm = childNodes.snapshotItem(i) as HTMLElement
      elm?.setAttribute('data-is-google-docs', 'true')

      if (
        elm?.parentElement === gDocsRootOrSiblingNode ||
        (!isWrappedRootTag && elm.parentElement === doc.body)
      ) {
        elm?.setAttribute('data-is-root-node', 'true')
        tagName(elm)
      }

      // Handle checkmark lists - The first child of a list item is an image with a checkmark, and the serializer
      // expects the first child to be the text node
      if (tagName(elm) === 'li' && elm.firstChild && tagName(elm?.firstChild) === 'img') {
        elm.removeChild(elm.firstChild)
      }
    }

    // Remove that 'b' which Google Docs wraps the HTML content in
    if (isWrappedRootTag) {
      doc.body.firstElementChild?.replaceWith(...Array.from(gDocsRootOrSiblingNode.childNodes))
    }

    return doc
  }
  return doc
}
