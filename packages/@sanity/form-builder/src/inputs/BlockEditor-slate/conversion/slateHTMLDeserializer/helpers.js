export function isPastedFromWord(html) {
  return /(class="?Mso|style=(?:"|')[^"]*?\bmso-|w:WordDocument|<o:\w+>|<\/font>)/.test(html)
}

function cleanUpWordDocument(html) {

  const unwantedWordDocumentPaths = [
    '/html/text()',
    '/html/head/text()',
    '/html/body/text()',
    '//p[not(.//text())]',
    '//span[not(.//text())]',
    '//comment()',
    "//*[name()='o:p']",
    '//style',
    '//xml',
    '//script',
    '//meta',
    '//link'
  ]

  const mappedPaths = [
    "//p[@class='MsoTitle']",
    "//p[@class='MsoToaHeading']",
    "//p[@class='MsoSubtitle']",
    "//span[@class='MsoSubtleEmphasis']",
    "//span[@class='MsoIntenseEmphasis']",
  ]

  const elementMap = {
    MsoTitle: 'h1',
    MsoToaHeading: 'h2',
    MsoSubtitle: 'h5',
    MsoSubtleEmphasis: 'span:em',
    MsoIntenseEmphasis: 'span:em:strong'
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')

  // Remove cruft
  const unwantedNodes = document.evaluate(
    unwantedWordDocumentPaths.join('|'),
    doc,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  )
  for (let i = unwantedNodes.snapshotLength - 1; i >= 0; i--) {
    const unwanted = unwantedNodes.snapshotItem(i)
    unwanted.parentNode.removeChild(unwanted)
  }

  // Transform mapped elements into what they should be mapped to
  const mappedElements = document.evaluate(
    mappedPaths.join('|'),
    doc,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  )
  for (let i = mappedElements.snapshotLength - 1; i >= 0; i--) {
    const mappedElm = mappedElements.snapshotItem(i)
    const mapToTag = elementMap[mappedElm.className]
    const text = new Text(mappedElm.textContent)
    let newElm
    if (mapToTag.includes(':')) {
      const tags = mapToTag.split(':')
      const parentElement = document.createElement(tags[0])
      let parent = parentElement
      let child
      tags.slice(1).forEach(tag => {
        child = document.createElement(tag)
        parent.appendChild(child)
        parent = child
      })
      child.appendChild(text)
      newElm = parentElement
    } else {
      newElm = document.createElement(mapToTag)
      newElm.appendChild(text)
    }
    mappedElm.parentNode.replaceChild(newElm, mappedElm)
  }

  return (new XMLSerializer()).serializeToString(doc)
}

export function isPastedFromGoogleDocs(el) {
  if (el.nodeType !== 1) {
    return false
  }
  const id = el.getAttribute('id')
  return id && id.match(/^docs-internal-guid-/)
}

export function cleanHtml(html) {
  let cleanedHtml = html
  if (isPastedFromWord(html)) {
    cleanedHtml = cleanUpWordDocument(html)
  }
  cleanedHtml = cleanedHtml
    .trim() // Trim whitespace
    .replace(/[\r\n]+/g, ' ') // Remove newlines / carriage returns
    .replace(/ {2,}/g, ' ') // Remove trailing spaces
  return cleanedHtml
}

export function resolveListItem(listNodeTagName) {
  let listStyle
  switch (listNodeTagName) {
    case 'ul':
      listStyle = 'bullet'
      break
    case 'ol':
      listStyle = 'number'
      break
    default:
      listStyle = 'bullet'
  }
  return listStyle
}

export function tagName(el) {
  if (!el || el.nodeType !== 1) {
    return undefined
  }
  return el.tagName.toLowerCase()
}
