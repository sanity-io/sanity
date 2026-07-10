import {type BooleanSchemaType, type ObjectSchemaType, type StringSchemaType} from '@sanity/types'

/**
 * A field the pane's schema type nominates for faceting (tier 2 of the
 * filter model: the content model drives the filter UI).
 *
 * @internal
 */
export interface FacetCandidateField {
  name: string
  title: string
  kind: 'enum' | 'boolean' | 'string'
  /** Present for `enum` candidates (from the schema's `options.list`). */
  options?: Array<{value: string; title: string}>
}

/**
 * A rendered filter facet: a candidate field resolved against the actual
 * document values.
 *
 * @internal
 */
export interface ListFieldFacet {
  name: string
  title: string
  options: Array<{value: string | boolean; title: string}>
}

/** publishedId -> field name -> value, fetched separately from the list
 * (the list query projects only identifiers). */
export type FacetValuesById = Record<string, Record<string, string | boolean>>

const MAX_FACETS = 4
const MAX_CANDIDATES = 6
const MAX_DATA_DRIVEN_VALUES = 8

function isStringField(schemaType: unknown): schemaType is StringSchemaType {
  return Boolean(schemaType) && (schemaType as StringSchemaType).jsonType === 'string'
}

function isBooleanField(schemaType: unknown): schemaType is BooleanSchemaType {
  return Boolean(schemaType) && (schemaType as BooleanSchemaType).jsonType === 'boolean'
}

/**
 * Nominates the facetable fields of a schema type: booleans, strings with a
 * declared vocabulary (`options.list`), and plain strings (which become
 * facets only if the data turns out to be low-cardinality).
 *
 * @internal
 */
export function getFacetCandidateFields(
  schemaType: ObjectSchemaType | undefined,
): FacetCandidateField[] {
  if (!schemaType?.fields) return []

  const candidates: FacetCandidateField[] = []

  for (const field of schemaType.fields) {
    if (candidates.length >= MAX_CANDIDATES) break
    const fieldType = field.type

    if (isBooleanField(fieldType)) {
      candidates.push({name: field.name, title: fieldType.title ?? field.name, kind: 'boolean'})
      continue
    }

    if (!isStringField(fieldType)) continue

    const list = fieldType.options?.list
    if (Array.isArray(list) && list.length > 0) {
      candidates.push({
        name: field.name,
        title: fieldType.title ?? field.name,
        kind: 'enum',
        options: list
          .map((entry) =>
            typeof entry === 'string'
              ? {value: entry, title: entry}
              : {value: String(entry.value ?? ''), title: String(entry.title ?? entry.value ?? '')},
          )
          .filter((option) => option.value !== ''),
      })
      continue
    }

    candidates.push({name: field.name, title: fieldType.title ?? field.name, kind: 'string'})
  }

  return candidates
}

/**
 * Resolves candidates against the fetched values: declared facets (enum,
 * boolean) always show; plain strings show only when the data holds a small
 * vocabulary with at least one repeat.
 *
 * @internal
 */
export function buildFieldFacets(
  candidates: FacetCandidateField[],
  valuesById: FacetValuesById,
): ListFieldFacet[] {
  const documentCount = Object.keys(valuesById).length
  const declared: ListFieldFacet[] = []
  const dataDriven: ListFieldFacet[] = []

  for (const candidate of candidates) {
    if (candidate.kind === 'boolean') {
      declared.push({
        name: candidate.name,
        title: candidate.title,
        options: [
          {value: true, title: 'Yes'},
          {value: false, title: 'No'},
        ],
      })
      continue
    }

    if (candidate.kind === 'enum') {
      declared.push({
        name: candidate.name,
        title: candidate.title,
        options: candidate.options ?? [],
      })
      continue
    }

    const values = new Set<string>()
    for (const fields of Object.values(valuesById)) {
      const value = fields[candidate.name]
      if (typeof value === 'string' && value) values.add(value)
    }
    // A facet where every document is unique doesn't narrow anything.
    if (values.size >= 2 && values.size <= MAX_DATA_DRIVEN_VALUES && values.size < documentCount) {
      dataDriven.push({
        name: candidate.name,
        title: candidate.title,
        options: Array.from(values)
          .sort()
          .map((value) => ({value, title: value})),
      })
    }
  }

  return [...declared, ...dataDriven].slice(0, MAX_FACETS)
}
