import {_XPathResult} from './xpathResult'

export default (html: string, doc: Document): Document => {
  const gDocsRootNode = doc
    .evaluate(
      '//b[contains(@id, "docs-internal-guid")]',
      doc,
      null,
      _XPathResult.ORDERED_NODE_ITERATOR_TYPE,
      null,
    )
    .iterateNext()

  if (gDocsRootNode) {
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
    }
    // Remove that 'b' which Google Docs wraps the HTML content in
    doc.body.firstElementChild?.replaceWith(...Array.from(gDocsRootNode.childNodes))
    return doc
  }
  return doc
}
