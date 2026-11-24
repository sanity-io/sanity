import {type NamedResource} from './pokeapi'

export function english<T extends {language: NamedResource}>(entries: T[]): T | undefined {
  return entries.find((entry) => entry.language.name === 'en')
}

export function latestEnglish<T extends {language: NamedResource}>(entries: T[]): T | undefined {
  return entries.findLast((entry) => entry.language.name === 'en')
}

/**
 * Normalizes in-game text: joins soft-hyphenated and wrapped lines, collapses whitespace and
 * replaces the all-caps names of the older games ("POKéMON", "PIKACHU", "BERRIES") with regular
 * casing. Words shorter than four letters keep their case, so "HP" and "PP" stay as they are.
 */
export function cleanText(text: string | undefined): string | undefined {
  const cleaned = text
    ?.replace(/\u00ad[\n\f\r]?/g, '')
    .replace(/-[\n\f\r]+/g, '-')
    .replace(/[\n\f\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\bPOKé ?BALL(S?)\b/g, 'Poké Ball$1')
    .replace(/\bPOKé?MON\b/g, 'Pokémon')
    .replace(/\bMR\. /g, 'Mr. ')
    .replace(
      /(?<![\p{L}])[\p{Lu}é][\p{Lu}é♀♂]{3,}(?![\p{L}])/gu,
      (word) => word[0] + word.slice(1).toLowerCase(),
    )
    .trim()
  return cleaned || undefined
}

export function titleCase(name: string): string {
  return name
    .split('-')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ')
}

/** "a", "a and b", "a, b and c" */
export function listFormat(items: string[], conjunction = 'and'): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items.at(-1)}`
}

/** Text that only differs in case, punctuation or spacing is the same entry. */
function textKey(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

export interface UniqueText {
  text: string
  games: string[]
}

/**
 * Collapses the English entries that repeat across games into one entry per distinct text,
 * listing every game that uses it, in the order the games appear.
 */
export function uniqueEnglishTexts<T extends {language: NamedResource}>(
  entries: T[],
  getText: (entry: T) => string | undefined,
  getGame: (entry: T) => string | undefined,
): UniqueText[] {
  const byKey = new Map<string, UniqueText>()
  for (const entry of entries) {
    if (entry.language.name !== 'en') continue
    const text = cleanText(getText(entry))
    if (!text) continue
    const key = textKey(text)
    const game = getGame(entry)
    const existing = byKey.get(key)
    if (existing) {
      if (game && !existing.games.includes(game)) existing.games.push(game)
    } else {
      byKey.set(key, {text, games: game ? [game] : []})
    }
  }
  return [...byKey.values()]
}

/** Joins sentences into one paragraph, making sure each ends with punctuation. */
export function paragraph(sentences: (string | false | undefined | null)[]): string {
  return sentences
    .filter((sentence): sentence is string => typeof sentence === 'string' && sentence !== '')
    .map((sentence) => (/[.!?…]["”’)]?$/.test(sentence) ? sentence : `${sentence}.`))
    .join(' ')
}

/** "a Fire-type", "an Electric-type" */
export function withArticle(word: string): string {
  return /^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`
}
