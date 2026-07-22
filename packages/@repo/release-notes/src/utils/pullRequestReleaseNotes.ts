import {type NormalizedMarkdownBlock} from './portabletext-markdown/markdownToPortableText'
import {type PortableTextMarkdownBlock} from './portabletext-markdown/types'

export function extractReleaseNotes(blocks: NormalizedMarkdownBlock[]) {
  let activeHeaderIsReleaseNotes = false
  const releaseNotesBlocks: NormalizedMarkdownBlock[] = []

  for (const block of blocks) {
    if (isHeading(block)) {
      if (activeHeaderIsReleaseNotes) break
      if (getBlockText(block).includes('Notes for release')) {
        activeHeaderIsReleaseNotes = true
        continue
      }
    }
    if (!activeHeaderIsReleaseNotes) continue
    // A horizontal rule ends the section. Tools like Cursor Bugbot append
    // their review after a `---` separator; humans following the PR template
    // convention likewise put a `---` at the end of their release notes.
    if (block._type === 'horizontal-rule') break
    releaseNotesBlocks.push(block)
  }
  return releaseNotesBlocks
}

function isHeading(block: PortableTextMarkdownBlock) {
  if (block._type !== 'block' || typeof block.style !== 'string' || block.style.length !== 2) {
    return false
  }

  const [prefix, levelChar] = block.style
  const level = Number(levelChar)

  return prefix === 'h' && level >= 1 && level <= 6
}

export function shouldExcludeReleaseNotes(blocks: PortableTextMarkdownBlock[]): boolean {
  const [block] = blocks
  if (!block) {
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

function getBlockText(block: PortableTextMarkdownBlock) {
  if (block._type !== 'block' || !Array.isArray(block.children)) {
    return ''
  }

  return block.children
    .map((child) => (child._type === 'span' && typeof child?.text === 'string' ? child.text : ''))
    .join('')
}
