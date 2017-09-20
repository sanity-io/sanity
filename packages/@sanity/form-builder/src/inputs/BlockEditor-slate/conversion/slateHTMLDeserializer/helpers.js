export function isPastedFromWord(html) {
  return /(class="?Mso|style=(?:"|')[^"]*?\bmso-|w:WordDocument|<o:\w+>|<\/font>)/.test(html)
}

function cleanUpWordDocument(html) {

  const unwantedWordDocumentPaths = ['/html/text()', '/html/head/text()', '/html/body/text()', '//span[not(text())]', '//p[not(text())]', '//comment()', "//*[name()='o:p']", '//style', '//xml', '//script', '//meta', '//link',]

  const doc = new DOMParser().parseFromString(html, 'text/html')

  // Remove cruft
  const unwantedNodes = document.evaluate(
    `${unwantedWordDocumentPaths.join('|')}`,
    doc,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  )
  for (let i = unwantedNodes.snapshotLength - 1; i >= 0; i--) {
    const unwanted = unwantedNodes.snapshotItem(i)
    unwanted.parentNode.removeChild(unwanted)
  }

  // Transform titles into H1s
  const titleElments = document.evaluate(
    "//p[@class='MsoTitle']",
    doc,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  )
  for (let i = titleElments.snapshotLength - 1; i >= 0; i--) {
    const title = titleElments.snapshotItem(i)
    const h1 = document.createElement('h1')
    h1.appendChild(new Text(title.textContent))
    title.parentNode.replaceChild(h1, title)
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
