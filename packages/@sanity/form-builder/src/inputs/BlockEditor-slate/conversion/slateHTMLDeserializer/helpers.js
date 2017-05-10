import cheerio from 'cheerio'
import cleanUpWordDocument from './cleanUpWordDocument'
import {HTML_BLOCK_TAGS, HTML_HEADER_TAGS} from './rules'

const wordRegexp = /(class="?Mso|style=(?:"|')[^"]*?\bmso-|w:WordDocument|<o:\w+>|<\/font>)/

function isUnwantedElement(index, node) {
  return node.type === 'comment' || node.type === 'directive'
}

function unwrapBlockTags(doc) {
  const blockTags = Object.keys(HTML_BLOCK_TAGS).concat(Object.keys(HTML_HEADER_TAGS))
  const blockSelect = blockTags.join(', ')

  doc.root().contents()
    .each((index, node) => {
      const childBlocks = doc(node).find(blockSelect)
      if (childBlocks.length && blockTags.includes(node.tagName)) {
        doc(node).attr('data-unwrapped', 'true')
        childBlocks.insertAfter(node)
      }
    })

  // Remove any empty leftover empty block tags if we have unwrapped anything
  doc.root()
    .find('*[data-unwrapped=true]')
    .filter((index, node) => {
      return doc(node).text().trim() === ''
    })
    .remove()

  return doc
}

function wrapOrphanBrs(doc) {
  doc.root()
    .find('br')
    .each((index, node) => {
      if (!node.parent) {
        doc(node).replaceWith('<p></p>')
      }
    })
  return doc
}

export function isPastedFromGoogleDocs(el) {
  return el.attribs
    && el.attribs.id
    && el.attribs.id.match(/^docs-internal-guid-/)
}

export function cleanupHtml(html) {
  const isWordDocument = wordRegexp.test(html)
  let doc = null
  try {
    doc = cheerio.load(cheerio.load(html)('body').html())
  } catch (err) {
    doc = cheerio.load(html)
  }
  doc.root()
    .find('*')
    .contents()
    .filter(isUnwantedElement)
    .remove()

  if (isWordDocument) {
    doc = cleanUpWordDocument(doc)
  }

  doc = unwrapBlockTags(doc)

  doc = wrapOrphanBrs(doc)

  const cleanHtml = doc.html()
    .trim()   // Trim whitespace
    .replace(/[\r\n]+/g, ' ') // Remove newlines / carriage returns
    .replace(/ {2,}/g, ' ') // Remove trailing spaces
  return cleanHtml
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
