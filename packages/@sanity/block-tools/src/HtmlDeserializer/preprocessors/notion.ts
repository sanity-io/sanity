import {_XPathResult} from './xpathResult'

export default (html: string, doc: Document): Document => {
  const NOTION_REGEX = /<!-- notionvc:.*?-->/g

  if (html.match(NOTION_REGEX)) {
    // Tag every child with attribute 'is-notion' so that the Notion rule-set can
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
      elm?.setAttribute('data-is-notion', 'true')
    }

    return doc
  }
  return doc
}
