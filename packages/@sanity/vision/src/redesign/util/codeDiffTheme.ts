import {type TagStyle} from '@codemirror/language'
import {type Tag, tags as t} from '@lezer/highlight'

import {getHighlighter} from './highlightSnippet'

export type CodeDiffScheme = 'light' | 'dark'

interface SyntaxRole {
  name: string
  /** The tag the editors' parser gives the token, which picks its color from the editor specs */
  tag: Tag
  /** The TextMate scopes Shiki's grammars give the same token */
  scopes: string[]
}

// JSON keys are strings to the editors' parser, and `null` shares `true` and `false`'s scope in
// Shiki's JSON grammar, so it takes the boolean color the editors leave it without
const SYNTAX_ROLES: SyntaxRole[] = [
  {name: 'string', tag: t.string, scopes: ['string', 'support.type.property-name']},
  {name: 'number', tag: t.number, scopes: ['constant.numeric']},
  {name: 'boolean', tag: t.bool, scopes: ['constant.language']},
  {name: 'escape', tag: t.escape, scopes: ['constant.character.escape']},
  {
    name: 'separator',
    tag: t.separator,
    scopes: ['punctuation.separator.array', 'punctuation.separator.dictionary.pair'],
  },
]

function syntaxProperty(role: SyntaxRole): string {
  return `--vision-diff-syntax-${role.name}`
}

/** The name the diffs' highlighter knows Vision's theme for a color scheme by */
export function codeDiffThemeName(scheme: CodeDiffScheme): string {
  return `sanity-vision-${scheme}`
}

/**
 * A TextMate theme whose colors are all custom properties, so it follows every studio theme: the
 * card's colors, and the editors' syntax colors set by `codeDiffSyntaxProperties` on an ancestor
 * of the diff. Only its type differs by scheme, which sets the color scheme the diff's chrome is
 * mixed in (a theme without one counts as dark).
 */
export function createCodeDiffTheme(scheme: CodeDiffScheme) {
  return {
    name: codeDiffThemeName(scheme),
    type: scheme,
    colors: {
      'editor.foreground': 'var(--card-fg-color)',
      'editor.background': 'var(--card-bg-color)',
    },
    tokenColors: SYNTAX_ROLES.map((role) => ({
      scope: role.scopes,
      settings: {foreground: `var(${syntaxProperty(role)})`},
    })),
  }
}

/** The editors' color for each token the diff theme colors, as the properties it reads them from */
export function codeDiffSyntaxProperties(specs: readonly TagStyle[]): Record<string, string> {
  const highlighter = getHighlighter(specs)
  const properties: Record<string, string> = {}
  for (const role of SYNTAX_ROLES) {
    const index = Number.parseInt(highlighter.style([role.tag]) ?? '', 10)
    const color: unknown = Number.isNaN(index) ? undefined : specs[index].color
    // Unset, the property leaves the token in the text color, as the editors do
    if (typeof color === 'string') properties[syntaxProperty(role)] = color
  }
  return properties
}
