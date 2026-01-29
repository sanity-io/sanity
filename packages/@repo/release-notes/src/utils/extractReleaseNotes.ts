import {type NormalizedMarkdownBlock} from './portabletext-markdown/markdownToPortableText'
import {type PortableTextMarkdownBlock} from './portabletext-markdown/types'

export function extractReleaseNotes(blocks: NormalizedMarkdownBlock[]) {
  let activeHeaderIsReleaseNotes = false
  let blockNo = 0
  const releaseNotesBlocks: NormalizedMarkdownBlock[] = []

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
      if (blockNo === 0 && extractBlockText(block).toLowerCase().startsWith('n/a')) {
        return []
      }
      blockNo++
      releaseNotesBlocks.push(block)
    }
  }
  return releaseNotesBlocks
}

function isHeading(block: PortableTextMarkdownBlock) {
  if (block._type !== 'block' || typeof block.style !== 'string' || block.style.length !== 2) {
    return false
  }

  const [pref, l] = block.style
  const level = Number(l)

  return pref === 'h' && level >= 1 && level <= 6
}

function extractBlockText(block: PortableTextMarkdownBlock) {
  if (block._type !== 'block' || !Array.isArray(block.children)) {
    return ''
  }

  return block.children
    .map((child) => (child._type === 'span' && typeof child?.text === 'string' ? child.text : ''))
    .join('')
}
