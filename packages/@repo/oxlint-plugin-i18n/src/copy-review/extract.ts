import {parseSync} from 'oxc-parser'

/** One entry of an en-US locale resource object, with the TSDoc comment written above it */
export interface LocaleString {
  key: string
  value: string
  /** The comment directly above the key, without the comment markers, if there is one */
  comment: string | undefined
}

/** An added key, or a key whose English value changed, between two versions of a resource file */
export interface LocaleChange {
  file: string
  key: string
  kind: 'added' | 'changed'
  oldValue: string | undefined
  newValue: string
  comment: string | undefined
}

/**
 * Git pathspecs for the en-US locale resource files: the studio bundles and every plugin's
 * `i18n/resources.ts`. The lint plugin's own test fixtures look like resource files and are left out.
 * Keep in sync with the `paths:` filter in `.github/workflows/copy-review.yml`.
 */
export const LOCALE_RESOURCE_PATHSPECS = [
  ':(top,glob)packages/**/i18n/resources.ts',
  ':(top,glob)packages/**/i18n/bundles/*.ts',
  ':(top,exclude,glob)**/test/fixtures/**',
]

interface Node {
  type: string
  start: number
  end: number
  [key: string]: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNode(value: unknown): value is Node {
  return isRecord(value) && typeof value['type'] === 'string'
}

function propertyKey(node: Node): string | undefined {
  if (node['computed'] === true) return undefined
  const key = node['key']
  if (!isNode(key)) return undefined
  if (key.type === 'Literal' && typeof key['value'] === 'string') return key['value']
  if (key.type === 'Identifier' && typeof key['name'] === 'string') return key['name']
  return undefined
}

function stringValue(node: unknown): string | undefined {
  if (!isNode(node)) return undefined
  if (node.type === 'Literal' && typeof node['value'] === 'string') return node['value']
  if (node.type === 'TemplateLiteral') {
    const expressions = node['expressions']
    const quasis = node['quasis']
    if (!Array.isArray(expressions) || expressions.length > 0) return undefined
    if (!Array.isArray(quasis) || quasis.length !== 1) return undefined
    const quasi: unknown = quasis[0]
    if (!isRecord(quasi) || !isRecord(quasi['value'])) return undefined
    const cooked = quasi['value']['cooked']
    return typeof cooked === 'string' ? cooked : undefined
  }
  return undefined
}

/** Strips the comment markers and the leading `*` of every line of a block comment */
export function cleanComment(raw: string): string {
  return raw
    .split('\n')
    .map((line) => line.replace(/^\s*\*+\s?/, '').trim())
    .filter(Boolean)
    .join(' ')
    .trim()
}

/**
 * Reads the string entries of a locale resource file. Every object property with a string key
 * and a string value counts (resource files hold one flat object). A comment counts as the
 * entry's TSDoc when only whitespace separates it from the key.
 */
export function parseLocaleStrings(source: string, filename = 'resources.ts'): LocaleString[] {
  if (!source) return []
  const {program, comments} = parseSync(filename, source)
  const sortedComments = [...comments].sort((a, b) => a.start - b.start)
  const entries: LocaleString[] = []

  const commentBefore = (start: number): string | undefined => {
    let candidate: (typeof sortedComments)[number] | undefined
    for (const comment of sortedComments) {
      if (comment.end > start) break
      candidate = comment
    }
    if (!candidate) return undefined
    if (source.slice(candidate.end, start).trim() !== '') return undefined
    return cleanComment(candidate.value) || undefined
  }

  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item)
      return
    }
    if (!isNode(value)) return
    if (value.type === 'Property') {
      const key = propertyKey(value)
      const text = stringValue(value['value'])
      if (key !== undefined && text !== undefined) {
        entries.push({key, value: text, comment: commentBefore(value.start)})
        return
      }
    }
    for (const [field, child] of Object.entries(value)) {
      if (field === 'parent') continue
      if (typeof child === 'object' && child !== null) visit(child)
    }
  }

  visit(program)
  return entries
}

/** The keys a change added or whose value it changed. Removed keys are out of scope (see AGENTS.md). */
export function diffLocaleStrings(
  file: string,
  before: LocaleString[],
  after: LocaleString[],
): LocaleChange[] {
  const previous = new Map(before.map((entry) => [entry.key, entry.value]))
  const changes: LocaleChange[] = []
  for (const entry of after) {
    const oldValue = previous.get(entry.key)
    if (oldValue === entry.value) continue
    changes.push({
      file,
      key: entry.key,
      kind: oldValue === undefined ? 'added' : 'changed',
      oldValue,
      newValue: entry.value,
      comment: entry.comment,
    })
  }
  return changes
}
