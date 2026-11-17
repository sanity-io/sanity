import {type LocaleChange, type LocaleString} from './extract.ts'

/**
 * `error` hits are the ones `--strict` fails on: patterns with a known-bad reading. `warn` hits
 * are prompts for a second look, never a failure.
 */
export type Severity = 'error' | 'warn'

export interface RuleHit {
  rule: string
  severity: Severity
  message: string
  suggestion: string
}

export interface RuleContext {
  /** Every string in the same resource file after the change, the changed one included */
  siblings: LocaleString[]
}

export interface CopyRule {
  id: string
  severity: Severity
  description: string
  check: (change: LocaleChange, context: RuleContext) => Omit<RuleHit, 'rule' | 'severity'>[]
}

/** Simplified Technical English limit for a procedural sentence */
export const MAX_SENTENCE_WORDS = 25

/**
 * The same concept named two ways in one string set. A changed string that uses one term while
 * another string in the same file uses a different term for the same concept gets a warning.
 * Patterns only match the term acting on its object, so "published before this release" does
 * not count as "publish … release".
 */
export interface TermGroup {
  concept: string
  variants: {term: string; pattern: RegExp}[]
}

export const TERM_GROUPS: TermGroup[] = [
  {
    concept: 'carrying out a release',
    variants: [
      {
        term: 'run',
        pattern:
          /\b(?:run|runs|running)\b(?:\s+(?:the|this|a|all|your))?(?:\s+\S+)?\s+releases?\b/i,
      },
      {
        term: 'publish',
        pattern:
          /\b(?:publish|publishes|publishing)\b(?:\s+(?:the|this|a|all|your))?(?:\s+\S+)?\s+releases?\b/i,
      },
    ],
  },
  {
    concept: 'signing in',
    variants: [
      {term: 'sign in', pattern: /\bsign(?:ed|ing)?[\s-]?in\b/i},
      {term: 'log in', pattern: /\blog(?:ged|ging)?[\s-]?in\b/i},
    ],
  },
]

/** The text a reader sees: markup tags removed, whitespace collapsed. `{{interpolations}}` stay as one word. */
export function plainText(value: string): string {
  return value
    .replace(/<\/?[A-Za-z][^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?:])\s+(?=\S)/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

export function countWords(sentence: string): number {
  return sentence.split(/\s+/).filter((word) => /[\p{L}\p{N}{]/u.test(word)).length
}

const IRREGULAR_PARTICIPLES = [
  'built',
  'done',
  'found',
  'given',
  'held',
  'hidden',
  'kept',
  'known',
  'left',
  'lost',
  'made',
  'put',
  'read',
  'run',
  'seen',
  'sent',
  'set',
  'shown',
  'taken',
  'written',
]

const PASSIVE_WILL_BE = new RegExp(
  `\\b(?:will|won't|will not)\\s+be\\s+(?:\\w+ly\\s+)?(\\w+(?:ed|en)|${IRREGULAR_PARTICIPLES.join('|')})\\b`,
  'i',
)

export const RULES: CopyRule[] = [
  {
    id: 'no-are-you-sure',
    severity: 'error',
    description: 'Confirmations ask "Are you sure…" instead of naming the action',
    check(change) {
      if (!/\bare you sure\b/i.test(change.newValue)) return []
      return [
        {
          message: '"Are you sure…" asks about the user\'s confidence, not about the action.',
          suggestion:
            'Ask the action as a question that names its object ("Delete the \'{{title}}\' release?"), and say what happens in the body text.',
        },
      ]
    },
  },
  {
    id: 'no-unpublished-draft',
    severity: 'error',
    description: 'A draft described as having "unpublished" changes',
    check(change) {
      const text = plainText(change.newValue)
      const mentionsDraft = /\bdrafts?\b/i.test(text)
      const unpublishedChanges = /\bunpublished\s+(?:\w+\s+)?changes?\b/i.test(text)
      const unpublishedDraft = /\bunpublished\s+drafts?\b/i.test(text)
      if (!unpublishedDraft && !(mentionsDraft && unpublishedChanges)) return []
      return [
        {
          message:
            'Every change in a draft is unpublished, so "unpublished" adds nothing and reads as a tautology.',
          suggestion:
            'Say which changes and what happens to them: "draft changes that aren\'t in this release will be lost".',
        },
      ]
    },
  },
  {
    id: 'long-sentence',
    severity: 'warn',
    description: `Sentences over ${MAX_SENTENCE_WORDS} words`,
    check(change) {
      return splitSentences(plainText(change.newValue))
        .map((sentence) => ({sentence, words: countWords(sentence)}))
        .filter(({words}) => words > MAX_SENTENCE_WORDS)
        .map(({sentence, words}) => ({
          message: `A sentence has ${words} words (limit ${MAX_SENTENCE_WORDS}): "${sentence.slice(0, 80)}${sentence.length > 80 ? '…' : ''}"`,
          suggestion:
            'Split it: one sentence for what happens, one for what the user loses or must do.',
        }))
    },
  },
  {
    id: 'passive-will-be',
    severity: 'warn',
    description: 'Passive "will be + past participle"',
    check(change) {
      const match = PASSIVE_WILL_BE.exec(plainText(change.newValue))
      if (!match) return []
      return [
        {
          message: `Passive voice ("${match[0]}") hides who acts.`,
          suggestion:
            'Name the actor or address the user: "you lose …", "this publishes …". Keep the passive only when the actor does not matter.',
        },
      ]
    },
  },
  {
    id: 'consistent-terms',
    severity: 'warn',
    description: 'The same concept named two ways in one string set',
    check(change, {siblings}) {
      const hits: Omit<RuleHit, 'rule' | 'severity'>[] = []
      const text = plainText(change.newValue)
      for (const group of TERM_GROUPS) {
        const used = group.variants.find((variant) => variant.pattern.test(text))
        if (!used) continue
        for (const other of group.variants) {
          if (other === used) continue
          const keys = siblings
            .filter(
              (sibling) =>
                sibling.key !== change.key &&
                !/@deprecated/.test(sibling.comment ?? '') &&
                other.pattern.test(plainText(sibling.value)),
            )
            .map((sibling) => sibling.key)
          if (keys.length === 0) continue
          const examples = keys
            .slice(0, 3)
            .map((key) => `\`${key}\``)
            .join(', ')
          hits.push({
            message: `Says "${used.term}" for ${group.concept}, but ${keys.length} other string${keys.length === 1 ? '' : 's'} in this file say "${other.term}" (${examples}${keys.length > 3 ? ', …' : ''}).`,
            suggestion: `Pick one term for ${group.concept} and use it in every string a user sees in the same flow.`,
          })
        }
      }
      return hits
    },
  },
]

export function checkChange(change: LocaleChange, context: RuleContext): RuleHit[] {
  return RULES.flatMap((rule) =>
    rule.check(change, context).map((hit) => ({...hit, rule: rule.id, severity: rule.severity})),
  )
}
