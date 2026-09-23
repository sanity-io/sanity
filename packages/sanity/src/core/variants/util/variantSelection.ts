import {getVariantId} from '../tool/util'
import {DEFAULT_VARIANT_TYPE_KEY} from './variantType'

/**
 * One selected variant definition, keyed by type.
 *
 * @internal
 */
export interface VariantSelection {
  type: string
  /** Short id, without the `_.variants.` prefix. */
  name: string
}

/**
 * Reads the `variant` sticky param.
 *
 * `variant:Ab12,language:Fr12` is two selections. A bare id (no colon) is type `variant`.
 * Segments that do not include an id are ignored.
 *
 * @internal
 */
export function parseVariantStickyParam(value: string | undefined): VariantSelection[] {
  if (!value) {
    return []
  }

  const selections: VariantSelection[] = []

  for (const part of value.split(',')) {
    const trimmed = part.trim()

    if (!trimmed) {
      continue
    }

    const separator = trimmed.indexOf(':')

    if (separator === -1) {
      selections.push({type: DEFAULT_VARIANT_TYPE_KEY, name: trimmed})
      continue
    }

    const type = trimmed.slice(0, separator)
    const name = trimmed.slice(separator + 1)

    if (!type || !name) {
      continue
    }

    selections.push({type, name})
  }

  return selections
}

/**
 * Encodes one variant id for a link or sticky param: `<type>:<shortId>`.
 * Omitted `type` is {@link DEFAULT_VARIANT_TYPE_KEY}.
 *
 * @internal
 */
export function encodeVariantLinkParam(
  variantId: string,
  type: string = DEFAULT_VARIANT_TYPE_KEY,
): string {
  return `${type}:${getVariantId(variantId)}`
}

/**
 * Writes selections as `<type>:<id>` pairs, sorted by type key. Empty input is `null`
 * so the router drops the param.
 *
 * @internal
 */
export function serializeVariantStickyParam(
  selections: readonly VariantSelection[],
): string | null {
  if (selections.length === 0) {
    return null
  }

  return selections
    .map((selection) => ({type: selection.type, id: getVariantId(selection.name)}))
    .sort((a, b) => a.type.localeCompare(b.type))
    .map((selection) => `${selection.type}:${selection.id}`)
    .join(',')
}

/**
 * Replaces the selection for `type` and leaves every other type in place.
 * `id` undefined clears that type.
 *
 * @internal
 */
export function updateVariantSelection(
  current: readonly VariantSelection[],
  type: string,
  id: string | undefined,
): VariantSelection[] {
  const rest = current.filter((selection) => selection.type !== type)

  if (!id) {
    return rest
  }

  return [...rest, {type, name: getVariantId(id)}]
}
