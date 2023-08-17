import {_XPathResult} from './xpathResult'

const WORD_HTML_REGEX = /(class="?Mso|style=(?:"|')[^"]*?\bmso-|w:WordDocument|<o:\w+>|<\/font>)/

// xPaths for elements that will be removed from the document
const unwantedPaths = [
  '//o:p',
  "//span[@style='mso-list:Ignore']",
  "//span[@style='mso-list: Ignore']",
]

// xPaths for elements that needs to be remapped into other tags
const mappedPaths = [
  "//p[@class='MsoTocHeading']",
  "//p[@class='MsoTitle']",
  "//p[@class='MsoToaHeading']",
  "//p[@class='MsoSubtitle']",
  "//span[@class='MsoSubtleEmphasis']",
  "//span[@class='MsoIntenseEmphasis']",
]

// Which HTML element(s) to map the elements matching mappedPaths into
const elementMap: Record<string, string[] | undefined> = {
  MsoTocHeading: ['h3'],
  MsoTitle: ['h1'],
  MsoToaHeading: ['h2'],
  MsoSubtitle: ['h5'],
  MsoSubtleEmphasis: ['span', 'em'],
  MsoIntenseEmphasis: ['span', 'em', 'strong'],
  // Remove cruft
}

function isWordHtml(html: string) {
  return WORD_HTML_REGEX.test(html)
}

export default (html: string, doc: Document): Document => {
  if (!isWordHtml(html)) {
    return doc
  }

  const unwantedNodes = doc.evaluate(
    unwantedPaths.join('|'),
    doc,
    (prefix) => {
      if (prefix === 'o') {
        return 'urn:schemas-microsoft-com:office:office'
      }
      return null
    },
    _XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null,
  )

  for (let i = unwantedNodes.snapshotLength - 1; i >= 0; i--) {
    const unwanted = unwantedNodes.snapshotItem(i)
    if (unwanted?.parentNode) {
      unwanted.parentNode.removeChild(unwanted)
    }
  }

  // Transform mapped elements into what they should be mapped to
  const mappedElements = doc.evaluate(
    mappedPaths.join('|'),
    doc,
    null,
    _XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null,
  )
  for (let i = mappedElements.snapshotLength - 1; i >= 0; i--) {
    const mappedElm = mappedElements.snapshotItem(i) as HTMLElement
    const tags = elementMap[mappedElm.className]
    const text = new Text(mappedElm.textContent || '')
    if (!tags) {
      continue
    }

    const parentElement = document.createElement(tags[0])
    let parent = parentElement
    let child = parentElement
    tags.slice(1).forEach((tag) => {
      child = document.createElement(tag)
      parent.appendChild(child)
      parent = child
    })
    child.appendChild(text)
    mappedElm?.parentNode?.replaceChild(parentElement, mappedElm)
  }

  return doc
}
