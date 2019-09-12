import {_XPathResult} from './index'

export default (html, doc) => {
  // Remove this cruft from the document
  const unwantedWordDocumentPaths = [
    '/html/text()',
    '/html/head/text()',
    '/html/body/text()',
    '//comment()',
    '//style',
    '//xml',
    '//script',
    '//meta',
    '//link'
  ]

  const unwantedNodes = doc.evaluate(
    unwantedWordDocumentPaths.join('|'),
    doc,
    null,
    _XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  )
  for (let i = unwantedNodes.snapshotLength - 1; i >= 0; i--) {
    const unwanted = unwantedNodes.snapshotItem(i)
    unwanted.parentNode.removeChild(unwanted)
  }

  return doc
}
