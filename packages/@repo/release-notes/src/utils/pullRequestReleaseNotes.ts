import {type NormalizedMarkdownBlock} from './portabletext-markdown/markdownToPortableText'
import {type PortableTextMarkdownBlock} from './portabletext-markdown/types'

export function extractReleaseNotes(blocks: NormalizedMarkdownBlock[]) {
  let activeHeaderIsReleaseNotes = false
  const releaseNotesBlocks: NormalizedMarkdownBlock[] = []

  for (const block of blocks) {
    if (isHeading(block)) {
      if (activeHeaderIsReleaseNotes) {
        // new header
        break
      }
      if (getBlockText(block).includes('Notes for release')) {
        activeHeaderIsReleaseNotes = true
        continue
      }
    }
    if (activeHeaderIsReleaseNotes) {
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

export function shouldExcludeReleaseNotes(blocks: PortableTextMarkdownBlock[]): boolean {
  const [block] = blocks
  if (!block) {
    // consider only when explicitly stating that no release notes needed
    return false
  }
  const firstBlock = getBlockText(block).toLowerCase().trim()
  return (
    firstBlock.startsWith('n/a') ||
    firstBlock.startsWith('none') ||
    firstBlock.startsWith('not required') ||
    firstBlock.startsWith('not relevant') ||
    firstBlock.startsWith('not needed')
  )
}

export function getBlockText(block: PortableTextMarkdownBlock) {
  if (block._type !== 'block' || !Array.isArray(block.children)) {
    return ''
  }

  return block.children
    .map((child) => (child._type === 'span' && typeof child?.text === 'string' ? child.text : ''))
    .join('')
}
