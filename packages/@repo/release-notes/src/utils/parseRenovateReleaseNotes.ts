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
    const summaryText = match[1]?.trim() || ''
    const content = match[2]?.trim() || ''

    // Extract package name from parenthesized portion: "sanity-io/cli (@sanity/cli)"
    // The &#8203; is a zero-width space that Renovate inserts to prevent @-mentions
    const cleaned = summaryText.replace(/&#8203;/g, '')
    const parenMatch = cleaned.match(/\(([^)]+)\)\s*$/)
    const packageName = (parenMatch && parenMatch[1]?.trim()) || ''

    if (packageName && content) {
      blocks.push({packageName, content})
    }
  }

  return blocks
}

/**
 * Splits markdown by section headers (h5: `##### Section Name`) and keeps only
 * visible sections. Strips version headers (h3) and merges sections of the same
 * type across versions so multi-version PRs produce a single grouped output.
 */
function filterVisibleSections(markdown: string): string {
  const lines = markdown.split('\n')

  // Map from lowercase section name → list of content lines (excluding the header itself)
  const sectionItems = new Map<string, string[]>()
  // Track insertion order for deterministic output
  const sectionOrder: string[] = []

  let currentSection: string | null = null
  let inVisibleSection = false

  for (const line of lines) {
    // Version header (h3): ### [`v6.1.3`](...) — skip entirely
    if (/^###\s+\[/.test(line)) {
      currentSection = null
      inVisibleSection = false
      continue
    }

    // Section header (h5): ##### Bug Fixes
    const sectionMatch = line.match(/^#{5}\s+(.+)/)
    if (sectionMatch) {
      const sectionName = sectionMatch[1]?.trim().toLowerCase() || ''
      inVisibleSection = VISIBLE_CHANGELOG_SECTIONS.has(sectionName)
      if (inVisibleSection) {
        currentSection = sectionName
        if (!sectionItems.has(sectionName)) {
          sectionItems.set(sectionName, [])
          sectionOrder.push(sectionName)
        }
      } else {
        currentSection = null
      }
      continue
    }

    if (inVisibleSection && currentSection) {
      sectionItems.get(currentSection)!.push(line)
    }
  }

  // Collect all items without section headers
  const output: string[] = []
  for (const section of sectionOrder) {
    output.push(...sectionItems.get(section)!)
  }

  return output.join('\n')
}

/**
 * Strip trailing commit hashes like `([0b660b9](url))` from list items,
 * unwrap PR/issue refs from outer parentheses so the link is preserved
 * (e.g. `([#661](url))` → `[#661](url)`),
 * and remove dependency-scoped items (e.g. `- **deps:** ...`) that aren't meaningful for release notes.
 */
function cleanChangelogItems(markdown: string): string {
  return (
    markdown
      // Remove dependency-scoped list items
      .replace(/^\s*-\s+\*\*deps:\*\*.*$/gm, '')
      // Strip trailing commit hash links like ([0b660b9](url))
      .replace(/\s*\(\[[0-9a-f]+]\([^)]*\)\)/gm, '')
      // Unwrap PR/issue refs: ([#123](url)) → [#123](url) so the link is preserved
      .replace(/\(\[#(\d+)]\(([^)]*)\)\)/gm, '[#$1]($2)')
  )
}
