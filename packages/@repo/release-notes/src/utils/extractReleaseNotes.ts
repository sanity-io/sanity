import {type PortableTextBlock} from '@sanity/types'

export function extractReleaseNotes(blocks: PortableTextBlock[]): PortableTextBlock[] {
  let headerActive = false
  let blockNo = 0
  const releaseNotesBlocks = []

  for (const block of blocks) {
    if (isHeading(block)) {
      if (headerActive) {
        // new header
        headerActive = false
        break
      }
      if (extractBlockText(block).includes('Notes for release')) {
        headerActive = true
        continue
      }
    }
    if (headerActive) {
      if (!isHTMLComment(block)) {
        if (blockNo === 0 && extractBlockText(block).toLowerCase().startsWith('n/a')) {
          return []
        }
        blockNo++
        releaseNotesBlocks.push(block)
      }
    }
  }
  return releaseNotesBlocks
}

function isHeading(block: PortableTextBlock) {
  if (block._type !== 'block' || typeof block.style !== 'string' || block.style.length !== 2) {
    return false
  }

  const [pref, l] = block.style
  const level = Number(l)

  return pref === 'h' && level >= 1 && level <= 6
}

function isHTMLBlock(
  block: PortableTextBlock,
): block is {_type: 'html'; html: string; _key: string} {
  if (block._type === 'html' && 'html' in block && typeof block.html === 'string') {
    return block.html.startsWith('<!--') && block.html.endsWith('-->')
  }
  return false
}

function isHTMLComment(block: PortableTextBlock) {
  return isHTMLBlock(block) && block.html.startsWith('<!--') && block.html.endsWith('-->')
}

function extractBlockText(block: PortableTextBlock) {
  if (block._type !== 'block' || !Array.isArray(block.children)) {
    return ''
  }

  return block.children.map((child) => child.text).join('')
}
