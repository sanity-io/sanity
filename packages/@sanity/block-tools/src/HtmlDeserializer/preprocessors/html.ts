import {_XPathResult} from './xpathResult'

// Remove this cruft from the document
const unwantedWordDocumentPaths = [
  '/html/text()',
  '/html/head/text()',
  '/html/body/text()',
  '/html/body/ul/text()',
  '/html/body/ol/text()',
  '//comment()',
  '//style',
  '//xml',
  '//script',
  '//meta',
  '//link',
]

export default (_html: string, doc: Document): Document => {
  // Make sure text directly on the body is wrapped in spans.
  // This mimics what the browser does before putting html on the clipboard,
  // when used in a script context with JSDOM
  const bodyTextNodes = doc.evaluate(
    '/html/body/text()',
    doc,
    null,
    _XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null,
  )

  for (let i = bodyTextNodes.snapshotLength - 1; i >= 0; i--) {
    const node = bodyTextNodes.snapshotItem(i) as HTMLElement
    const text = node.textContent || ''
    if (text.replace(/[^\S\n]+$/g, '')) {
      const newNode = doc.createElement('span')
      newNode.appendChild(doc.createTextNode(text))
      node.parentNode?.replaceChild(newNode, node)
    } else {
      node.parentNode?.removeChild(node)
    }
  }

  const unwantedNodes = doc.evaluate(
    unwantedWordDocumentPaths.join('|'),
    doc,
    null,
    _XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null,
  )
  for (let i = unwantedNodes.snapshotLength - 1; i >= 0; i--) {
    const unwanted = unwantedNodes.snapshotItem(i)
    if (!unwanted) {
      continue
    }
    unwanted.parentNode?.removeChild(unwanted)
  }
  return doc
}
