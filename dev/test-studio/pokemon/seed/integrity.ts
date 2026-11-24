import {POKEMON_ID_PREFIX} from '../constants'

export type Doc = Record<string, unknown> & {_id: string; _type: string}

/** Document ids must not contain dots, so anything outside `[a-zA-Z0-9_-]` becomes a hyphen. */
export const idPart = (part: string | number): string =>
  String(part).replace(/[^a-zA-Z0-9_-]/g, '-')

export const ids = {
  pokemon: (name: string) => `${POKEMON_ID_PREFIX}species_${idPart(name)}`,
  type: (name: string) => `${POKEMON_ID_PREFIX}type_${idPart(name)}`,
  ability: (name: string) => `${POKEMON_ID_PREFIX}ability_${idPart(name)}`,
  move: (name: string) => `${POKEMON_ID_PREFIX}move_${idPart(name)}`,
  generation: (number: number) => `${POKEMON_ID_PREFIX}generation_${idPart(number)}`,
}

export const reference = (_ref: string, _key?: string) => ({
  _type: 'reference',
  _ref,
  ...(_key && {_key}),
})

/** Throws when a document `_id` or a reference `_ref` anywhere in `value` contains a dot. */
export function assertNoDottedIds(value: unknown, path = '$'): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoDottedIds(item, `${path}[${index}]`))
    return
  }
  if (typeof value !== 'object' || value === null) return
  for (const [key, child] of Object.entries(value)) {
    if ((key === '_id' || key === '_ref') && typeof child === 'string' && child.includes('.')) {
      throw new Error(`${path}.${key} is "${child}", but document ids must not contain dots`)
    }
    assertNoDottedIds(child, `${path}.${key}`)
  }
}

/**
 * The types the seed writes, in the order their stale documents can be deleted. Every reference is
 * strong, so a document can only be deleted once nothing that stays references it: species go
 * first, then the abilities and moves they point at, then the types those point at, then the
 * generations everything points at. Species reference each other (evolutions) and so do types
 * (damage relations), so those references are unset before the documents are deleted; otherwise a
 * batch would fail on a reference to a document in a later batch.
 *
 * `validateDocuments` checks every reference the seed writes against this order.
 */
export const STALE_TIERS: {type: string; unset: string[]}[] = [
  {type: 'pokemon', unset: ['evolvesFrom', 'evolutions']},
  {type: 'pokemonAbility', unset: []},
  {type: 'pokemonMove', unset: []},
  {
    type: 'pokemonType',
    unset: [
      'strongAgainst',
      'notVeryEffectiveAgainst',
      'noEffectAgainst',
      'weakTo',
      'resistantTo',
      'immuneTo',
    ],
  },
  {type: 'pokemonGeneration', unset: []},
]

interface FoundReference {
  /** The top-level field the reference sits in. */
  field: string
  path: string
  ref: string
}

function collectReferences(value: unknown, path: string, field: string, out: FoundReference[]) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectReferences(item, `${path}[${index}]`, field, out))
    return
  }
  if (typeof value !== 'object' || value === null) return
  const record = value as Record<string, unknown>
  if (typeof record._ref === 'string') out.push({field, path, ref: record._ref})
  for (const [key, child] of Object.entries(record)) {
    collectReferences(child, `${path}.${key}`, field, out)
  }
}

function assertUniqueKeys(value: unknown, path: string, problems: string[]) {
  if (Array.isArray(value)) {
    const keys = value
      .map((item) => (typeof item === 'object' && item !== null ? item._key : undefined))
      .filter((key): key is string => typeof key === 'string')
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index)
    if (duplicates.length > 0) problems.push(`${path} repeats _key "${duplicates[0]}"`)
    value.forEach((item, index) => assertUniqueKeys(item, `${path}[${index}]`, problems))
    return
  }
  if (typeof value !== 'object' || value === null) return
  for (const [key, child] of Object.entries(value))
    assertUniqueKeys(child, `${path}.${key}`, problems)
}

/**
 * Checks the documents before anything is written: ids are dot-free and unique, array keys are
 * unique, every reference resolves to a document in the set (or to an uploaded asset), and every
 * reference agrees with `STALE_TIERS`, so pruning can always delete in that order.
 */
export function validateDocuments(docs: Doc[]): {documents: number; references: number} {
  assertNoDottedIds(docs)
  const problems: string[] = []
  const tierIndex = new Map(STALE_TIERS.map((tier, index) => [tier.type, index]))
  const byId = new Map<string, Doc>()
  for (const doc of docs) {
    if (byId.has(doc._id)) problems.push(`${doc._id} is written twice`)
    byId.set(doc._id, doc)
    if (!tierIndex.has(doc._type))
      problems.push(`${doc._id} has type ${doc._type}, which prune does not know`)
    if (!doc._id.startsWith(POKEMON_ID_PREFIX)) {
      problems.push(`${doc._id} is outside the ${POKEMON_ID_PREFIX} namespace`)
    }
  }

  let references = 0
  for (const doc of docs) {
    assertUniqueKeys(doc, doc._id, problems)
    const found: FoundReference[] = []
    for (const [field, value] of Object.entries(doc)) {
      collectReferences(value, `${doc._id}.${field}`, field, found)
    }
    references += found.length
    for (const {field, path, ref} of found) {
      if (ref.startsWith('image-') || ref.startsWith('file-')) continue
      const target = byId.get(ref)
      if (!target) {
        problems.push(`${path} references ${ref}, which is not written`)
        continue
      }
      const source = tierIndex.get(doc._type) ?? -1
      const destination = tierIndex.get(target._type) ?? -1
      const unset = STALE_TIERS[source]?.unset ?? []
      if (destination < source || (destination === source && !unset.includes(field))) {
        problems.push(
          `${path} references a ${target._type}, which prune would delete before or together with this ${doc._type}`,
        )
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `${problems.length} problems in the seed documents:\n  ${problems.slice(0, 20).join('\n  ')}`,
    )
  }
  return {documents: docs.length, references}
}
