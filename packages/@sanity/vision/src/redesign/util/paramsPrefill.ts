import {type TFunction} from 'sanity'

import {parseParams} from '../../components/ParamsEditor'
import {type visionLocaleNamespace} from '../../i18n'

function buildParamsInsertion(names: readonly string[]): string {
  return names.map((name) => `  ${JSON.stringify(name)}: "",\n`).join('')
}

/**
 * Appends `"name": ""` for every `name` not already a key `rawParams` has, without touching any
 * of its existing text (so comments, formatting and values survive untouched). `rawParams` is
 * returned unchanged when its root is not a `{...}` object, since there is then nowhere
 * unambiguous to insert into; an empty or whitespace-only `rawParams` is treated as `{}`.
 */
export function addMissingParams(rawParams: string, missingNames: readonly string[]): string {
  if (missingNames.length === 0) return rawParams
  const trimmed = rawParams.trim()
  if (trimmed === '') return `{\n${buildParamsInsertion(missingNames)}}`
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return rawParams

  // Insert right before the object's closing brace. Nothing before it is rewritten, only
  // appended to, so a value that happens to end in a line comment cannot have the new separator
  // land inside that comment.
  const closeIndex = rawParams.lastIndexOf('}')
  const before = rawParams.slice(0, closeIndex)
  const after = rawParams.slice(closeIndex)
  const isEmptyObject = before.trimEnd().endsWith('{')
  const hasTrailingComma = /,\s*$/.test(before)
  const needsComma = !isEmptyObject && !hasTrailingComma
  const separator = needsComma ? ',\n' : before.endsWith('\n') ? '' : '\n'
  return `${before}${separator}${buildParamsInsertion(missingNames)}${after}`
}

/**
 * Which of `referencedNames` `rawParams` has no key for yet. `undefined` when `rawParams` is not
 * valid JSON5 (common while it is mid-edit, and not worth reporting as an error here).
 */
export function missingParamNames(
  referencedNames: readonly string[],
  rawParams: string,
  t: TFunction<typeof visionLocaleNamespace>,
): string[] | undefined {
  const current = parseParams(rawParams, t)
  if (!current.valid) return undefined
  const existing = current.parsed ?? {}
  return referencedNames.filter((name) => !Object.hasOwn(existing, name))
}
