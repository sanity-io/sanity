import {_XPathResult} from './xpathResult'

function isGoogleDocsDocument(el: Element) {
  if (el.nodeType !== 1) {
    return false
  }
  const id = el.getAttribute('id')
  return id && id.match(/^docs-internal-guid-/) && el.tagName === 'B'
}

export default (html: string, doc: Document): Document => {
  if (doc.body.firstElementChild && isGoogleDocsDocument(doc.body.firstElementChild)) {
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
    doc.body.firstElementChild.replaceWith(...Array.from(doc.body.firstElementChild.childNodes))
    return doc
  }
  return doc
}
