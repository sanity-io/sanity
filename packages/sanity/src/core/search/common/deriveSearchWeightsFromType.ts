import {
  isReferenceSchemaType,
  type CrossDatasetType,
  type SchemaType,
  type SearchConfiguration,
  type SlugSchemaType,
} from '@sanity/types'
import {toString as pathToString} from '@sanity/util/paths'

import {isRecord} from '../../util'
import {type SearchPath, type SearchSpec} from './types'

interface SearchWeightEntry {
  path: string
  weight: number
  type: 'string' | 'pt'
}

const CACHE = new WeakMap<SchemaType | CrossDatasetType, SearchSpec>()
const PREVIEW_FIELD_WEIGHT_MAP = {
  title: 10,
  subtitle: 5,
  description: 1.5,
}
// Reference-traversing preview fields could use custom selection keys (e.g.
// `authorName`) rather than `title`/`subtitle`/`description`, so they need a
// fallback weight.
const DEFAULT_PREVIEW_SELECT_WEIGHT = 5

const BASE_WEIGHTS: Record<string, Omit<SearchWeightEntry, 'path'>> = {
  _id: {weight: 1, type: 'string'},
  _type: {weight: 1, type: 'string'},
}
const ignoredBuiltInObjectTypes = ['reference', 'crossDatasetReference', 'slug']

const getTypeChain = (type: SchemaType | undefined): SchemaType[] =>
  type ? [type, ...getTypeChain(type.type)] : []

const isPtField = (type: SchemaType | undefined) =>
  type?.jsonType === 'array' &&
  type.of.some((arrType) => getTypeChain(arrType).some(({name}) => name === 'block'))

const isStringField = (schemaType: SchemaType | undefined): boolean =>
  schemaType ? schemaType?.jsonType === 'string' : false

const isSlugField = (schemaType: SchemaType | undefined): schemaType is SlugSchemaType => {
  const typeChain = getTypeChain(schemaType)
  return typeChain.some(({jsonType, name}) => jsonType === 'object' && name === 'slug')
}

const isSearchConfiguration = (options: unknown): options is SearchConfiguration =>
  isRecord(options) && 'search' in options && isRecord(options.search)

function isSchemaType(input: SchemaType | CrossDatasetType | undefined): input is SchemaType {
  return typeof input !== 'undefined' && 'name' in input
}

function getFullyQualifiedPath(schemaType: SchemaType, path: string): string {
  // Slug field weights should be applied to the object's `current` field.
  if (isSlugField(schemaType)) {
    return [path, 'current'].join('.')
  }

  return path
}

function getLeafWeights(
  schemaType: SchemaType | CrossDatasetType | undefined,
  maxDepth: number,
  getWeight: (schemaType: SchemaType, path: string) => number | null,
): Record<string, SearchWeightEntry> {
  function traverse(
    type: SchemaType | undefined,
    path: string,
    depth: number,
    accumulator: SearchWeightEntry[] = [], // use accumulator to avoid stack overflow
  ): SearchWeightEntry[] {
    if (!type) return accumulator
    if (depth > maxDepth) return accumulator

    const typeChain = getTypeChain(type)

    if (isStringField(type) || isPtField(type)) {
      const weight = getWeight(type, path)
      if (typeof weight === 'number') {
        accumulator.push({path, weight, type: isPtField(type) ? 'pt' : 'string'})
      }
      return accumulator
    }

    if (isSlugField(type)) {
      const weight = getWeight(type, path)
      if (typeof weight === 'number') {
        accumulator.push({
          path: getFullyQualifiedPath(type, path),
          weight,
          type: isPtField(type) ? 'pt' : 'string',
        })
      }
      return accumulator
    }

    let recursiveResult = accumulator
    for (const t of typeChain) {
      if (
        t.jsonType === 'object' &&
        !!t.fields?.length &&
        !ignoredBuiltInObjectTypes.includes(t.name)
      ) {
        for (const field of t.fields) {
          recursiveResult = traverse(
            field.type,
            pathToString([path, field.name].filter(Boolean)),
            depth + 1,
            recursiveResult,
          )
        }
      } else if (t.jsonType === 'array' && !!t.of?.length) {
        for (const arrayItemType of t.of) {
          recursiveResult = traverse(arrayItemType, `${path}[]`, depth + 1, recursiveResult)
        }
      }
    }

    return recursiveResult
  }

  // Cross Dataset Reference are not part of the schema, so we should not attempt to reconcile them.
  if (!isSchemaType(schemaType)) {
    return {}
  }

  return traverse(schemaType, '', 0).reduce<Record<string, SearchWeightEntry>>(
    (acc, {path, weight, type}) => {
      acc[path] = {weight, type, path}
      return acc
    },
    {},
  )
}

const getUserSetWeight = (schemaType: SchemaType) => {
  const searchOptions = getTypeChain(schemaType)
    .map((type) => type.options)
    .find(isSearchConfiguration)

  return typeof searchOptions?.search?.weight === 'number' ? searchOptions.search.weight : null
}

const getHiddenWeight = (schemaType: SchemaType) => {
  const hidden = getTypeChain(schemaType).some((type) => type.hidden)
  return hidden ? 0 : null
}

const getDefaultWeights = (schemaType: SchemaType) => {
  // if there is no user set weight or a `0` weight due to be hidden,
  // then we can return the default weight of `1`
  const result = getUserSetWeight(schemaType) ?? getHiddenWeight(schemaType)
  return typeof result === 'number' ? null : 1
}

function findFieldType(type: SchemaType | undefined, fieldName: string): SchemaType | undefined {
  for (const chainType of getTypeChain(type)) {
    if (chainType.jsonType === 'object' && chainType.fields?.length) {
      const field = chainType.fields.find(({name}) => name === fieldName)
      if (field) return field.type
    }
  }
  return undefined
}

/**
 * Resolves a (dot-notation) preview `select` path to the "type" of its
 * searchable leaf, following references. Returns `null` when the path does not
 * resolve to a string / portable text / slug field.
 *
 * This reuses the same leaf classification as `getLeafWeights` (via
 * `isStringField` / `isPtField` / `isSlugField`), but walks a single explicit
 * path and follows references — which `getLeafWeights` intentionally does not,
 * to avoid traversing the entire reference graph.
 */
function resolveLeafType(
  type: SchemaType | undefined,
  segments: string[],
  depth: number,
  maxDepth: number,
): 'string' | 'pt' | 'slug' | null {
  if (!type || depth > maxDepth) return null

  if (segments.length === 0) {
    if (isPtField(type)) return 'pt'
    // Slug is reported separately so callers can target its `.current` leaf,
    // consistent with `getFullyQualifiedPath` in the default leaf traversal.
    if (isSlugField(type)) return 'slug'
    if (isStringField(type)) return 'string'
    return null
  }

  const [head, ...rest] = segments
  const fieldType = findFieldType(type, head)
  if (!fieldType) return null

  if (isReferenceSchemaType(fieldType) && 'to' in fieldType) {
    for (const target of fieldType.to) {
      const leaf = resolveLeafType(target, rest, depth + 1, maxDepth)
      if (leaf) return leaf
    }
    return null
  }

  return resolveLeafType(fieldType, rest, depth + 1, maxDepth)
}

/**
 * Derives search weights for preview `select` paths that the default leaf
 * traversal misses because they traverse references (e.g. `author.name`).
 * These fields are displayed in list previews, so they should be searchable.
 *
 * The resulting dot-notation path is compiled to a GROQ expression (e.g.
 * `author->name`) by `compileFieldPath` when the search query is built.
 *
 * @internal
 */
export function getPreviewSelectionPathWeights(
  schemaType: SchemaType,
  maxDepth: number,
  selectionKeysBySelectionPath: Record<string, string>,
  existingPaths: Set<string>,
): Record<string, SearchWeightEntry> {
  const weights: Record<string, SearchWeightEntry> = {}

  for (const [path, previewKey] of Object.entries(selectionKeysBySelectionPath)) {
    // Already handled by the default leaf traversal, or an array path (already
    // valid GROQ that doesn't need reference resolution).
    if (existingPaths.has(path) || path.includes('[]')) continue

    const leaf = resolveLeafType(schemaType, path.split('.'), 0, maxDepth)
    if (!leaf) continue

    // A slug is searchable on its `.current` string, so target that leaf.
    const resolvedPath = leaf === 'slug' && !path.endsWith('.current') ? `${path}.current` : path

    weights[resolvedPath] = {
      path: resolvedPath,
      weight:
        PREVIEW_FIELD_WEIGHT_MAP[previewKey as keyof typeof PREVIEW_FIELD_WEIGHT_MAP] ??
        DEFAULT_PREVIEW_SELECT_WEIGHT,
      type: leaf === 'pt' ? 'pt' : 'string',
    }
  }

  return weights
}

const getPreviewWeights = (
  schemaType: SchemaType | CrossDatasetType | undefined,
  maxDepth: number,
  isCrossDataset?: boolean,
): Record<string, SearchWeightEntry> | null => {
  const select = schemaType?.preview?.select
  if (!select) return null

  const selectionKeysBySelectionPath = Object.fromEntries(
    Object.entries(select).map(([selectionKey, selectionPath]) => [
      // replace indexed paths with `[]`
      // e.g. `arrayOfObjects.0.myField` becomes `arrayOfObjects[].myField`
      selectionPath.replace(/\.\d+/g, '[]'),
      selectionKey,
    ]),
  )

  const defaultWeights = getLeafWeights(schemaType, maxDepth, getDefaultWeights)
  const nestedWeightsBySelectionPath = Object.fromEntries(
    Object.entries(defaultWeights)
      .map(([path, {type}]) => ({path, type}))
      .filter(({path}) => selectionKeysBySelectionPath[path])
      .map(({path, type}) => [
        path,
        {
          type,
          weight:
            PREVIEW_FIELD_WEIGHT_MAP[
              selectionKeysBySelectionPath[path] as keyof typeof PREVIEW_FIELD_WEIGHT_MAP
            ],
        },
      ]),
  )

  if (isCrossDataset) {
    return Object.fromEntries(
      Object.entries(selectionKeysBySelectionPath).map(([path, previewFieldName]) => {
        return [
          path,
          {
            path,
            type: 'string',
            weight:
              PREVIEW_FIELD_WEIGHT_MAP[previewFieldName as keyof typeof PREVIEW_FIELD_WEIGHT_MAP],
          },
        ]
      }),
    )
  }

  const previewSelectionPathWeights = isSchemaType(schemaType)
    ? getPreviewSelectionPathWeights(
        schemaType,
        maxDepth,
        selectionKeysBySelectionPath,
        new Set(Object.keys(defaultWeights)),
      )
    : {}

  const previewWeightsFromLeafTraversal = getLeafWeights(schemaType, maxDepth, (type, path) => {
    const nested = nestedWeightsBySelectionPath[getFullyQualifiedPath(type, path)]
    return nested ? nested.weight : null
  })

  return {
    ...previewSelectionPathWeights,
    ...previewWeightsFromLeafTraversal,
  }
}

export interface DeriveSearchWeightsFromTypeOptions {
  schemaType: SchemaType | CrossDatasetType
  maxDepth: number
  isCrossDataset?: boolean
  processPaths?: (paths: SearchPath[]) => SearchPath[]
}

export function deriveSearchWeightsFromType({
  schemaType,
  maxDepth,
  isCrossDataset,
  processPaths = (paths) => paths,
}: DeriveSearchWeightsFromTypeOptions): SearchSpec {
  const cached = CACHE.get(schemaType)
  if (cached) return cached

  const userSetWeights = getLeafWeights(schemaType, maxDepth, getUserSetWeight)
  const hiddenWeights = getLeafWeights(schemaType, maxDepth, getHiddenWeight)
  const defaultWeights = getLeafWeights(schemaType, maxDepth, getDefaultWeights)
  const previewWeights = getPreviewWeights(schemaType, maxDepth, isCrossDataset)

  const weights: Record<string, Omit<SearchWeightEntry, 'path'>> = {
    ...BASE_WEIGHTS,
    ...defaultWeights,
    ...hiddenWeights,
    ...previewWeights,
    ...userSetWeights,
  }

  const result = {
    typeName: isSchemaType(schemaType) ? schemaType.name : schemaType.type,
    paths: processPaths(
      Object.entries(weights).map(([path, {type, weight}]) => ({
        path,
        weight,
        ...(type === 'pt' && {mapWith: 'pt::text'}),
      })),
    ),
  }

  CACHE.set(schemaType, result)
  return result
}
