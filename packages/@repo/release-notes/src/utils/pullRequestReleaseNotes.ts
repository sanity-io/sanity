import {extractSectionWithLlm, type ExtractSectionOptions} from './extractSectionWithLlm'
import {
  markdownToPortableText,
  type NormalizedMarkdownBlock,
} from './portabletext-markdown/markdownToPortableText'
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

// Trust the deterministic extractor when the section contains a horizontal
// rule. Without one, tool-appended content (Cursor Bugbot, etc.) leaks in, so
// route the raw section text through an LLM cleaner instead.
export async function extractReleaseNotesFromPrBody(
  prBody: string,
  options: ExtractSectionOptions = {},
): Promise<NormalizedMarkdownBlock[]> {
  const blocks = markdownToPortableText(prBody)
  if (sectionContainsHorizontalRule(blocks)) return extractReleaseNotes(blocks)

  const rawSection = extractRawSection(prBody)
  if (!rawSection) return extractReleaseNotes(blocks)

  const cleaned = await extractSectionWithLlm(rawSection, options)
  if (cleaned === null) return extractReleaseNotes(blocks)
  if (!cleaned.trim()) return []
  return markdownToPortableText(cleaned)
}

function sectionContainsHorizontalRule(blocks: PortableTextMarkdownBlock[]): boolean {
  let inSection = false
  for (const block of blocks) {
    if (isHeading(block)) {
      if (inSection) return false
      if (getBlockText(block).includes('Notes for release')) {
        inSection = true
      }
      continue
    }
    if (inSection && block._type === 'horizontal-rule') return true
  }
  return false
}

function extractRawSection(prBody: string): string {
  const headingMatch = prBody.match(/^ {0,3}#{1,6}\s+.*Notes for release.*$/im)
  if (!headingMatch || headingMatch.index === undefined) return ''
  const afterHeading = prBody.slice(headingMatch.index + headingMatch[0].length)
  const nextHeading = afterHeading.match(/^ {0,3}#{1,6}\s+\S/m)
  const sectionBody =
    nextHeading && nextHeading.index !== undefined
      ? afterHeading.slice(0, nextHeading.index)
      : afterHeading
  return sectionBody.trim()
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
