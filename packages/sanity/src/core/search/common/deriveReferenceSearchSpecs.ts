import {
  isReferenceSchemaType,
  type CrossDatasetType,
  type ObjectSchemaType,
  type SchemaType,
} from '@sanity/types'

/**
 * @internal
 *
 * A searchable leaf on a *referenced* document surfaced in a list preview (e.g.
 * `subtitle: 'author.name'`). Normal search-weight derivation stops at reference
 * boundaries, so these leaves are otherwise unsearchable. We surface them by
 * resolving matching referenced documents up front and boosting the referring
 * documents via `references()` — not by compiling `author->name`, which crashes
 * `groq2024`'s `score()` and forces a non-index-accelerated per-document join.
 */
export interface ReferenceSearchSpec {
  targetType: string
  leafPath: string
  weight: number
  mapWith?: 'pt::text'
}

const PREVIEW_FIELD_WEIGHT_MAP: Record<string, number> = {
  title: 10,
  subtitle: 5,
  description: 1.5,
}

// Fallback for custom selection keys (e.g. `authorName`) that aren't title/subtitle/description.
const DEFAULT_PREVIEW_SELECT_WEIGHT = 5

const CACHE = new WeakMap<SchemaType, Map<number, ReferenceSearchSpec[]>>()

const getTypeChain = (type: SchemaType | undefined): SchemaType[] =>
  type ? [type, ...getTypeChain(type.type)] : []

const isStringField = (type: SchemaType | undefined): boolean => type?.jsonType === 'string'

const isPtField = (type: SchemaType | undefined): boolean =>
  type?.jsonType === 'array' &&
  type.of.some((arrayMemberType) =>
    getTypeChain(arrayMemberType).some(({name}) => name === 'block'),
  )

const isSlugField = (type: SchemaType | undefined): boolean =>
  getTypeChain(type).some(({jsonType, name}) => jsonType === 'object' && name === 'slug')

function isSchemaType(input: SchemaType | CrossDatasetType | undefined): input is SchemaType {
  return typeof input !== 'undefined' && 'name' in input
}

function findFieldType(type: SchemaType | undefined, fieldName: string): SchemaType | undefined {
  for (const chainType of getTypeChain(type)) {
    if (chainType.jsonType === 'object' && chainType.fields?.length) {
      const field = chainType.fields.find(({name}) => name === fieldName)
      if (field) {
        return field.type
      }
    }
  }
  return undefined
}

interface ResolvedLeaf {
  leafPath: string
  mapWith?: 'pt::text'
}

// Resolves the leaf path within a referenced document. Bails on a further
// reference or array so the match stays single-hop and index-accelerated.
function resolveLeaf(
  type: SchemaType | undefined,
  segments: string[],
  depth: number,
  maxDepth: number,
): ResolvedLeaf | undefined {
  if (type === undefined || depth > maxDepth) {
    return undefined
  }

  if (segments.length === 0) {
    if (isPtField(type)) {
      return {leafPath: '', mapWith: 'pt::text'}
    }
    // A slug is searchable on its `.current` string - but only if that field
    // actually resolves, so a custom object named `slug` doesn't emit a dead clause.
    if (isSlugField(type) && isStringField(findFieldType(type, 'current'))) {
      return {leafPath: 'current'}
    }
    if (isStringField(type)) {
      return {leafPath: ''}
    }
    return undefined
  }

  const [head, ...rest] = segments
  const fieldType = findFieldType(type, head)
  if (fieldType === undefined || isReferenceSchemaType(fieldType)) {
    return undefined
  }

  const resolved = resolveLeaf(fieldType, rest, depth + 1, maxDepth)
  if (resolved === undefined) {
    return undefined
  }

  return {
    leafPath: resolved.leafPath === '' ? head : `${head}.${resolved.leafPath}`,
    mapWith: resolved.mapWith,
  }
}

interface ReferenceBoundary {
  targetTypes: ObjectSchemaType[]
  leafSegments: string[]
}

function walkToReference(
  type: SchemaType | undefined,
  segments: string[],
  depth: number,
  maxDepth: number,
): ReferenceBoundary | undefined {
  if (type === undefined || depth > maxDepth || segments.length === 0) {
    return undefined
  }

  const [head, ...rest] = segments
  const fieldType = findFieldType(type, head)
  if (fieldType === undefined) {
    return undefined
  }

  if (isReferenceSchemaType(fieldType) && 'to' in fieldType) {
    return {targetTypes: fieldType.to, leafSegments: rest}
  }

  return walkToReference(fieldType, rest, depth + 1, maxDepth)
}

/**
 * @internal
 *
 * Derives specs from a type's preview `select` paths that traverse a reference.
 * Only single-hop paths to a searchable leaf are supported; array paths and
 * chained references are skipped.
 */
export function deriveReferenceSearchSpecs({
  schemaType,
  maxDepth,
}: {
  schemaType: SchemaType | CrossDatasetType
  maxDepth: number
}): ReferenceSearchSpec[] {
  if (!isSchemaType(schemaType)) {
    return []
  }

  const cachedByDepth = CACHE.get(schemaType) ?? new Map<number, ReferenceSearchSpec[]>()
  const cached = cachedByDepth.get(maxDepth)
  if (cached) {
    return cached
  }

  const select = schemaType.preview?.select
  const byTargetAndLeaf = new Map<string, ReferenceSearchSpec>()

  for (const [selectionKey, rawPath] of Object.entries(select ?? {})) {
    // Skip array paths (e.g. `authors.0.name`): arrays of references are unsupported here.
    if (rawPath.replace(/\.\d+/g, '[]').includes('[]')) {
      continue
    }

    const boundary = walkToReference(schemaType, rawPath.split('.'), 0, maxDepth)
    if (boundary === undefined || boundary.leafSegments.length === 0) {
      continue
    }

    const weight = PREVIEW_FIELD_WEIGHT_MAP[selectionKey] ?? DEFAULT_PREVIEW_SELECT_WEIGHT

    for (const targetType of boundary.targetTypes) {
      const leaf = resolveLeaf(targetType, boundary.leafSegments, 0, maxDepth)
      if (leaf === undefined || leaf.leafPath === '') {
        continue
      }

      const dedupeKey = `${targetType.name}:${leaf.leafPath}`
      const existing = byTargetAndLeaf.get(dedupeKey)
      if (existing === undefined || existing.weight < weight) {
        byTargetAndLeaf.set(dedupeKey, {
          targetType: targetType.name,
          leafPath: leaf.leafPath,
          weight,
          ...(leaf.mapWith ? {mapWith: leaf.mapWith} : {}),
        })
      }
    }
  }

  const specs = Array.from(byTargetAndLeaf.values())
  cachedByDepth.set(maxDepth, specs)
  CACHE.set(schemaType, cachedByDepth)
  return specs
}
