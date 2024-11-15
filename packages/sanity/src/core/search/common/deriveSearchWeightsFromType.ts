import {
  type CrossDatasetType,
  type ReferenceSchemaType,
  type SchemaType,
  type SearchConfiguration,
} from '@sanity/types'
import {toString as pathToString} from '@sanity/util/paths'

import {isRecord} from '../../util'
import {type SearchPath, type SearchSpec} from './types'

interface SearchWeightEntry {
  path: string
  fullyQualifiedPath: string
  weight: number
  type: 'string' | 'pt'
}

const CACHE = new WeakMap<SchemaType | CrossDatasetType, SearchSpec>()
const PREVIEW_FIELD_WEIGHT_MAP = {
  title: 10,
  subtitle: 5,
  description: 1.5,
}
const BASE_WEIGHTS: Record<string, Omit<SearchWeightEntry, 'path' | 'fullyQualifiedPath'>> = {
  _id: {weight: 1, type: 'string'},
  _type: {weight: 1, type: 'string'},
}
const builtInObjectTypes = ['reference', 'crossDatasetReference']

const getTypeChain = (type: SchemaType | undefined): SchemaType[] =>
  type ? [type, ...getTypeChain(type.type)] : []

const isPtField = (type: SchemaType | undefined) =>
  type?.jsonType === 'array' &&
  type.of.some((arrType) => getTypeChain(arrType).some(({name}) => name === 'block'))

const isStringField = (schemaType: SchemaType | undefined): boolean =>
  schemaType ? schemaType?.jsonType === 'string' : false

const isSearchConfiguration = (options: unknown): options is SearchConfiguration =>
  isRecord(options) && 'search' in options && isRecord(options.search)

function isSchemaType(input: SchemaType | CrossDatasetType | undefined): input is SchemaType {
  return typeof input !== 'undefined' && 'name' in input
}

type AccessType = 'property' | 'dereference'

const accessTokens: Record<AccessType, string> = {
  property: '.',
  dereference: '->',
}

/**
 * Traverse the schema, following the provided path. Yields a string for each segment and accessor
 * that comprises the fully qualified path. This path properly dereferences dot-notation property
 * access of references.
 *
 * For example, in a schema containing a reference field named `reference`, the path
 * `document.reference.field` would be converted to the fully qualified path
 * `document.reference->field`. The generator would yield `"document"`, `"."`, `"reference"`,
 * `"->"`, `"field`".
 */
function* traverseByPath(
  type: SchemaType | CrossDatasetType | undefined,
  [head, ...tail]: string[],
  accessType?: AccessType,
): Generator<string> {
  // Skip non-schema types, including Cross Dataset References.
  // TODO: How should Cross Dataset References be weighted?
  if (!isSchemaType(type)) {
    return
  }

  if (typeof head === 'undefined') {
    if (accessType === 'dereference') {
      yield accessTokens.dereference
    }
    return
  }

  if (accessType) {
    yield accessTokens[accessType]
  }

  if (isStringField(type) || isPtField(type)) {
    yield head
    return
  }

  const typeChain = getTypeChain(type)

  // TODO: Handle arrays.
  // replace indexed paths with `[]`
  // e.g. `arrayOfObjects.0.myField` becomes `arrayOfObjects[].myField`
  // selectionPath.replace(/\.\d+/g, '[]'),

  const objectTypes = typeChain.filter(
    (t): t is Extract<SchemaType, {jsonType: 'object'}> =>
      t.jsonType === 'object' && !!t.fields?.length && !builtInObjectTypes.includes(t.name),
  )

  for (const objectType of objectTypes) {
    for (const field of objectType.fields) {
      if (field.name === head) {
        yield head
        yield* traverseByPath(
          field.type,
          tail,
          field.type.name === 'reference' ? 'dereference' : 'property',
        )
        return
      }
    }
  }

  if (objectTypes.length !== 0) {
    throw new Error(`Field \`${head}\` not found in \`${type.name}\`.`)
  }

  const referenceTypes = typeChain.filter(
    (t): t is ReferenceSchemaType => (t.type ?? {}).name === 'reference',
  )

  for (const referenceType of referenceTypes) {
    // TODO: How should we handle multiple reference types?
    for (const referenceTargetType of referenceType.to) {
      yield head
      for (const field of referenceTargetType.fields) {
        if (field.name === head) {
          yield* traverseByPath(
            field.type,
            tail,
            field.type.name === 'reference' ? 'dereference' : 'property',
          )
          return
        }
      }
    }
  }

  if (referenceTypes.length !== 0) {
    throw new Error(`Field \`${head}\` not found in type.`)
  }
}

function resolvePath(type: SchemaType | CrossDatasetType | undefined, path: string): string {
  return [...traverseByPath(type, path.split('.'))].join('')
}

/**
 * Get weights for reference fields that have explicitly been given weights; either by selecting
 * them for document list previews or by assigning their weight directly.
 *
 * Unlike other field types, references are not automatically factored into search result weighting.
 */
function getReferencePreviewWeights(
  schemaType: SchemaType | CrossDatasetType | undefined,
): Record<string, SearchWeightEntry> {
  const select = schemaType?.preview?.select ?? {}
  const paths = Object.entries(select)

  return paths.reduce<Record<string, SearchWeightEntry>>((weights, [key, path]) => {
    try {
      const fullyQualifiedPath = [...traverseByPath(schemaType, path.split('.'))].join('')
      const includesDereference = fullyQualifiedPath.includes(accessTokens.dereference)

      // Exclude any path that does not include a dereference.
      if (!includesDereference) {
        return weights
      }

      return {
        ...weights,
        [path]: {
          path,
          fullyQualifiedPath,
          weight: PREVIEW_FIELD_WEIGHT_MAP[key as keyof typeof PREVIEW_FIELD_WEIGHT_MAP] ?? 1,
        },
      }
    } catch (error) {
      throw new Error(`Unable to resolve schema path \`${path}\`. ${error.message}`, {
        cause: error,
      })
    }
  }, {})
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
  ): SearchWeightEntry[] {
    if (!type) return []
    if (depth > maxDepth) return []

    const typeChain = getTypeChain(type)

    if (isStringField(type) || isPtField(type)) {
      const weight = getWeight(type, path)

      if (typeof weight !== 'number') return []
      return [{path, fullyQualifiedPath: path, weight, type: isPtField(type) ? 'pt' : 'string'}]
    }

    const results: SearchWeightEntry[] = []
    const objectTypes = typeChain.filter(
      (t): t is Extract<SchemaType, {jsonType: 'object'}> =>
        t.jsonType === 'object' && !!t.fields?.length && !builtInObjectTypes.includes(t.name),
    )
    for (const objectType of objectTypes) {
      for (const field of objectType.fields) {
        const nextPath = pathToString([path, field.name].filter(Boolean))
        results.push(...traverse(field.type, nextPath, depth + 1))
      }
    }

    const referenceTypes = typeChain.filter(
      (t): t is ReferenceSchemaType => (t.type ?? {}).name === 'reference',
    )

    // TODO: Change to `isReferenceType`?
    // TODO: Handle multiple reference types.
    if (referenceTypes.length !== 0) {
      for (const referenceType of referenceTypes) {
        for (const referenceTargetType of referenceType.to) {
          const weight = getWeight(type, path)
          if (!Array.isArray(weight)) {
            continue
          }
          const [selfWeight, weights] = weight
          const paths = Object.entries(weights)
          for (const [nestedPath, nestedWeight] of paths) {
            results.push({
              path: nestedPath,
              fullyQualifiedPath: resolvePath(referenceTargetType, nestedPath),
              weight: nestedWeight,
            })
          }
        }
      }
    }

    const arrayTypes = typeChain.filter(
      (t): t is Extract<SchemaType, {jsonType: 'array'}> =>
        t.jsonType === 'array' && !!t.of?.length,
    )
    for (const arrayType of arrayTypes) {
      for (const arrayItemType of arrayType.of) {
        const nextPath = `${path}[]`
        results.push(...traverse(arrayItemType, nextPath, depth + 1))
      }
    }

    return results
  }

  // Cross Dataset Reference are not part of the schema, so we should not attempt to reconcile them.
  if (!isSchemaType(schemaType)) {
    return {}
  }

  return traverse(schemaType, '', 0).reduce<Record<string, SearchWeightEntry>>(
    (acc, searchWeightEntry) => {
      acc[searchWeightEntry.path] = searchWeightEntry
      return acc
    },
    {},
  )
}

const getUserSetWeight = (schemaType: SchemaType) => {
  const searchOptions = getTypeChain(schemaType)
    .map((type) => type.options)
    .find(isSearchConfiguration)

  if (typeof searchOptions?.search?.weights !== 'undefined') {
    return [searchOptions?.search?.weight, searchOptions.search.weights]
  }

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
      .map((searchWeightEntry) => [
        searchWeightEntry.path,
        {
          ...searchWeightEntry,
          weight:
            PREVIEW_FIELD_WEIGHT_MAP[
              selectionKeysBySelectionPath[
                searchWeightEntry.path
              ] as keyof typeof PREVIEW_FIELD_WEIGHT_MAP
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
            fullyQualifiedPath: path,
            type: 'string',
            weight:
              PREVIEW_FIELD_WEIGHT_MAP[previewFieldName as keyof typeof PREVIEW_FIELD_WEIGHT_MAP],
          },
        ]
      }),
    )
  }

  return getLeafWeights(schemaType, maxDepth, (_, path) => {
    const nested = nestedWeightsBySelectionPath[path]
    return nested ? nested.weight : null
  })
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
  const referencePreviewWeights = getReferencePreviewWeights(schemaType)

  const weights: Record<string, Omit<SearchWeightEntry, 'path'>> = {
    ...BASE_WEIGHTS,
    ...defaultWeights,
    ...hiddenWeights,
    ...previewWeights,
    ...referencePreviewWeights,
    ...userSetWeights,
  }

  const result = {
    typeName: isSchemaType(schemaType) ? schemaType.name : schemaType.type,
    paths: processPaths(
      Object.entries(weights).map(([path, {weight, fullyQualifiedPath}]) => ({
        path,
        fullyQualifiedPath,
        weight,
        ...(type === 'pt' && {mapWith: 'pt::text'}),
      })),
    ),
  }

  CACHE.set(schemaType, result)
  return result
}
