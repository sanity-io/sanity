import {type PortableTextBlock} from '@sanity/types'

export function extractReleaseNotes(blocks: PortableTextBlock[]): PortableTextBlock[] {
  let activeHeaderIsReleaseNotes = false
  let blockNo = 0
  const releaseNotesBlocks = []

  for (const block of blocks) {
    if (isHeading(block)) {
      if (activeHeaderIsReleaseNotes) {
        // new header
        break
      }
      if (extractBlockText(block).includes('Notes for release')) {
        activeHeaderIsReleaseNotes = true
        continue
      }
    }
    if (activeHeaderIsReleaseNotes) {
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
  return block._type === 'html' && 'html' in block && typeof block.html === 'string'
}

function isHTMLComment(block: PortableTextBlock) {
  return isHTMLBlock(block) && block.html.startsWith('<!--') && block.html.endsWith('-->')
}

function extractBlockText(block: PortableTextBlock) {
  if (block._type !== 'block' || !Array.isArray(block.children)) {
    return ''
  }

  return block.children.map((child) => (typeof child?.text === 'string' ? child.text : '')).join('')
}
