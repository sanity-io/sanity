import {
  isCrossDatasetReferenceSchemaType,
  isReferenceSchemaType,
  type SchemaType,
} from '@sanity/types'

import {INCLUDE_FIELDS_QUERY} from '../constants'
import {type PreviewPath} from '../types'
import {maybeEscape} from './optimizeQuery'

/**
 * A node in the projection tree. Each node represents a field in the GROQ
 * projection and may have children (nested fields) and/or a dereference marker
 * (for reference fields resolved with `->` syntax).
 * @internal
 */
interface ProjectionNode {
  dereference: boolean
  children: Map<string, ProjectionNode>
}

/**
 * Outcome of building a projection from preview paths + schema type.
 *
 * - `projection`: the GROQ projection body (e.g. `_id,_rev,_type,title,"authorName":author->{name}`)
 * - `flat`: `true` when we were able to collapse all reference paths into a
 *    single projection (no cross-dataset refs, no unsupported nesting)
 * @internal
 */
export interface PreviewProjection {
  projection: string
  flat: boolean
}

function getOrCreateChild(
  nodes: Map<string, ProjectionNode>,
  name: string,
  dereference: boolean,
): ProjectionNode {
  const existing = nodes.get(name)
  if (existing) {
    existing.dereference ||= dereference
    return existing
  }
  const node: ProjectionNode = {dereference, children: new Map()}
  nodes.set(name, node)
  return node
}

/**
 * Walks a single preview path against the schema type tree and inserts nodes
 * into the shared projection tree.
 *
 * Returns `false` if the path cannot be flattened (cross-dataset ref or
 * schema field not found), signalling the caller to fall back.
 */
function insertPath(
  nodes: Map<string, ProjectionNode>,
  schemaType: SchemaType | undefined,
  path: string[],
): boolean {
  if (path.length === 0) return true

  const [head, ...tail] = path

  if (!schemaType || !('fields' in schemaType)) {
    // No schema info — treat as a leaf (flat field)
    getOrCreateChild(nodes, head, false)
    // If there are tail segments we can't resolve without schema, bail
    return tail.length === 0
  }

  const field = schemaType.fields.find((f) => f.name === head)
  if (!field) {
    // Implicit field (_createdAt, _updatedAt, etc.) or missing — emit as leaf
    getOrCreateChild(nodes, head, false)
    return tail.length === 0
  }

  const fieldType = field.type

  if (tail.length === 0) {
    // Leaf field — no nesting needed
    getOrCreateChild(nodes, head, false)
    return true
  }

  // Cross-dataset references cannot use `->` in a single query
  if (isCrossDatasetReferenceSchemaType(fieldType)) {
    return false
  }

  if (isReferenceSchemaType(fieldType)) {
    const refNode = getOrCreateChild(nodes, head, true)
    // Walk into each possible target type's fields.
    // Because we don't know which target type is actual at query time,
    // we union across all `to` types — GROQ `->` resolves whichever exists.
    let anyResolved = false
    for (const targetType of fieldType.to) {
      if (insertPath(refNode.children, targetType, tail)) {
        anyResolved = true
      }
    }
    return anyResolved
  }

  // Regular nested object
  const objectNode = getOrCreateChild(nodes, head, false)
  return insertPath(objectNode.children, fieldType, tail)
}

/**
 * Serializes the projection tree into a GROQ projection string.
 *
 * Leaf nodes become plain field names. Nodes with children become nested
 * projections: `field{child1, child2}` for objects, `field->{child1, child2}`
 * for references.
 *
 * When a reference node has children, the projection is aliased so the result
 * embeds the dereferenced object under the field name:
 *   `"fieldName": fieldName->{_id, _rev, _type, child1, child2}`
 */
function serializeProjection(nodes: Map<string, ProjectionNode>): string {
  return [...nodes.entries()]
    .map(([name, node]) => {
      if (node.children.size === 0) {
        return maybeEscape(name)
      }

      const childProjection = serializeProjection(node.children)

      if (node.dereference) {
        const innerFields = [...INCLUDE_FIELDS_QUERY, childProjection].join(',')
        return `"${name}": ${maybeEscape(name)}->{${innerFields}}`
      }

      return `${maybeEscape(name)}{${childProjection}}`
    })
    .join(',')
}

/**
 * Builds a GROQ projection string from preview paths and an optional schema
 * type. When the schema type is available, reference fields are resolved
 * inline with `->` syntax, eliminating the per-level fetch waterfall.
 *
 * Falls back to a flat field list (current behavior) when:
 * - No schema type is provided
 * - A path traverses a cross-dataset reference
 * - A path references a field not found in the schema
 *
 * @internal
 */
export function buildPreviewProjection(
  paths: PreviewPath[],
  schemaType?: SchemaType,
): PreviewProjection {
  if (!schemaType) {
    return flatProjection(paths)
  }

  const nodes = new Map<string, ProjectionNode>()

  for (const path of paths) {
    if (!insertPath(nodes, schemaType, path)) {
      // A path can't be flattened — fall back entirely to avoid partial
      // flattening which would complicate the pipeline
      return flatProjection(paths)
    }
  }

  // Only use the flat path when there are actual reference fields to flatten.
  // Without references the recursive approach has no waterfall, so there's no
  // benefit and we avoid an unnecessary code path switch.
  const hasReferences = [...nodes.values()].some((node) => node.dereference)
  if (!hasReferences) {
    return flatProjection(paths)
  }

  const projection = [...INCLUDE_FIELDS_QUERY, serializeProjection(nodes)].join(',')

  return {projection, flat: true}
}

function flatProjection(paths: PreviewPath[]): PreviewProjection {
  const heads = new Set<string>()
  for (const path of paths) {
    if (path.length > 0) {
      heads.add(path[0])
    }
  }
  const allFields = [...INCLUDE_FIELDS_QUERY, ...heads]
  return {
    projection: allFields.map(maybeEscape).join(','),
    flat: false,
  }
}
