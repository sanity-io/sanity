import {parseVariantSetValues, type VariantSetDimension} from './variantSetPermutations'

/**
 * The on-disk shape of a variant set: its name and dimension table. Deliberately just the
 * keys/values — not the generated definitions — so a set can be authored elsewhere (or in a CDP)
 * and imported, and re-exported round-trips cleanly.
 *
 * @internal
 */
export interface VariantSetJson {
  name: string
  dimensions: {key: string; values: string[]}[]
}

/**
 * Serialize a set's name and dimensions to pretty-printed JSON. Incomplete dimensions (no key or
 * no values) are dropped so the export always reflects what would actually generate.
 *
 * @internal
 */
export function serializeVariantSet(input: {
  name: string
  dimensions: VariantSetDimension[]
}): string {
  const payload: VariantSetJson = {
    name: input.name.trim(),
    dimensions: input.dimensions
      .filter((dimension) => dimension.key.trim() && dimension.values.length > 0)
      .map((dimension) => ({key: dimension.key.trim(), values: dimension.values})),
  }

  return JSON.stringify(payload, null, 2)
}

/**
 * The result of parsing an imported variant-set JSON file: either the extracted name and
 * dimensions, or an error code the UI can turn into a message. Values are run through the same
 * parser the manual input uses, so imported and typed sets behave identically.
 *
 * @internal
 */
export type ParseVariantSetResult =
  | {ok: true; name: string; dimensions: VariantSetDimension[]}
  | {ok: false; error: 'invalid-json' | 'invalid-shape' | 'no-dimensions'}

/**
 * Parse imported JSON into a set's name and dimensions. Accepts the {@link VariantSetJson} shape
 * as well as a bare `{key: [values]}` / `{key: "a, b"}` map, so hand-written files and CDP exports
 * are both tolerated. Returns a typed error rather than throwing.
 *
 * @internal
 */
export function parseVariantSetJson(text: string): ParseVariantSetResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return {ok: false, error: 'invalid-json'}
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {ok: false, error: 'invalid-shape'}
  }

  const record = parsed as Record<string, unknown>
  let name = ''
  const dimensions: VariantSetDimension[] = []

  if (Array.isArray(record.dimensions)) {
    // Canonical VariantSetJson shape.
    if (typeof record.name === 'string') {
      name = record.name
    }
    for (const entry of record.dimensions) {
      if (typeof entry !== 'object' || entry === null) {
        return {ok: false, error: 'invalid-shape'}
      }
      const dimension = entry as Record<string, unknown>
      if (typeof dimension.key !== 'string' || !Array.isArray(dimension.values)) {
        return {ok: false, error: 'invalid-shape'}
      }
      const values = dimension.values.filter((value): value is string => typeof value === 'string')
      dimensions.push({key: dimension.key.trim(), values: dedupe(values)})
    }
  } else {
    // Bare {key: values} map, where values may be an array or a comma-separated string.
    for (const [key, value] of Object.entries(record)) {
      if (key === 'name' && typeof value === 'string') {
        name = value
        continue
      }
      if (Array.isArray(value)) {
        const values = value.filter((item): item is string => typeof item === 'string')
        dimensions.push({key: key.trim(), values: dedupe(values)})
      } else if (typeof value === 'string') {
        dimensions.push({key: key.trim(), values: parseVariantSetValues(value)})
      } else {
        return {ok: false, error: 'invalid-shape'}
      }
    }
  }

  const usable = dimensions.filter((dimension) => dimension.key && dimension.values.length > 0)
  if (usable.length === 0) {
    return {ok: false, error: 'no-dimensions'}
  }

  return {ok: true, name, dimensions: usable}
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of values) {
    const value = raw.trim()
    if (value && !seen.has(value)) {
      seen.add(value)
      result.push(value)
    }
  }
  return result
}
