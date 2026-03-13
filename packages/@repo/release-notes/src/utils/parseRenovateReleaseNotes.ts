import {
  markdownToPortableText,
  type NormalizedMarkdownBlock,
} from './portabletext-markdown/markdownToPortableText'

/**
 * Packages whose Renovate release notes are parsed into changelog contents.
 * Add packages here as they get a prBodyTemplate with changelogs in renovate.json.
 */
export const RENOVATE_RELEASE_NOTES_PACKAGES: ReadonlySet<string> = new Set(['@sanity/cli'])

const VISIBLE_CHANGELOG_SECTIONS: ReadonlySet<string> = new Set([
  'features',
  'bug fixes',
  'performance improvements',
  'reverts',
  'documentation',
])

interface DetailsBlock {
  packageName: string
  content: string
}

/**
 * Parses a Renovate PR body and returns portable text blocks for allowed packages.
 * Returns an empty array for non-Renovate bodies or bodies with no allowed packages.
 * Operates on raw markdown/HTML since `<details>` blocks don't survive portable text conversion.
 */
export function parseRenovateReleaseNotes(prBody: string): NormalizedMarkdownBlock[] {
  const blocks = extractDetailsBlocks(prBody)
  const allowed = blocks.filter((b) => RENOVATE_RELEASE_NOTES_PACKAGES.has(b.packageName))

  if (allowed.length === 0) return []

  const combined = allowed.map((b) => b.content).join('\n\n')
  const filtered = filterVisibleSections(combined)
  const cleaned = cleanChangelogItems(filtered)

  if (!cleaned.trim()) return []

  return markdownToPortableText(cleaned)
}

/**
 * Extract `<details>` blocks from the PR body, returning the package name
 * (from the `<summary>`) and the inner markdown content.
 */
function extractDetailsBlocks(body: string): DetailsBlock[] {
  const blocks: DetailsBlock[] = []
  // Match <details> blocks with <summary> containing "repo (package)" format
  const detailsRegex = /<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi
  let match

  while ((match = detailsRegex.exec(body)) !== null) {
    const summaryText = match[1].trim()
    const content = match[2].trim()

    // Extract package name from parenthesized portion: "sanity-io/cli (@sanity/cli)"
    // The &#8203; is a zero-width space that Renovate inserts to prevent @-mentions
    const cleaned = summaryText.replace(/&#8203;/g, '')
    const parenMatch = cleaned.match(/\(([^)]+)\)\s*$/)
    const packageName = parenMatch ? parenMatch[1].trim() : ''

    if (packageName && content) {
      blocks.push({packageName, content})
    }
  }

  return blocks
}

/**
 * Splits markdown by section headers (h5: `##### Section Name`) and keeps only
 * visible sections. Removes version headers (h3) that end up with no visible sections.
 */
function filterVisibleSections(markdown: string): string {
  const lines = markdown.split('\n')
  const output: string[] = []

  let currentVersionHeader: string | null = null
  let currentVersionLines: string[] = []
  let inVisibleSection = false
  let hasVisibleContent = false

  function flushVersion() {
    if (hasVisibleContent) {
      if (currentVersionHeader !== null) {
        output.push(currentVersionHeader)
      }
      output.push(...currentVersionLines)
    }
    currentVersionHeader = null
    currentVersionLines = []
    inVisibleSection = false
    hasVisibleContent = false
  }

  for (const line of lines) {
    // Version header (h3): ### [`v6.1.3`](...)
    if (/^###\s+\[/.test(line)) {
      flushVersion()
      currentVersionHeader = line
      continue
    }

    // Section header (h5): ##### Bug Fixes
    const sectionMatch = line.match(/^#{5}\s+(.+)/)
    if (sectionMatch) {
      const sectionName = sectionMatch[1].trim().toLowerCase()
      inVisibleSection = VISIBLE_CHANGELOG_SECTIONS.has(sectionName)
      if (inVisibleSection) {
        currentVersionLines.push(line)
        hasVisibleContent = true
      }
      continue
    }

    if (inVisibleSection) {
      currentVersionLines.push(line)
    }
  }

  flushVersion()
  return output.join('\n')
}

/**
 * Strip trailing commit hashes like `(0b660b9)` and PR refs like `(#661)` from list items,
 * and remove dependency-scoped items (e.g. `- **deps:** ...`) that aren't meaningful for release notes.
 */
function cleanChangelogItems(markdown: string): string {
  return (
    markdown
      // Remove dependency-scoped list items
      .replace(/^\s*-\s+\*\*deps:\*\*.*$/gm, '')
      // Strip PR refs and commit hashes from remaining items
      .replace(
        /^(\s*-\s+.+?)\s*(?:\(\[#\d+]\([^)]*\)\)\s*)?(?:\(\[[0-9a-f]+]\([^)]*\)\)\s*)?$/gm,
        '$1',
      )
  )
}
