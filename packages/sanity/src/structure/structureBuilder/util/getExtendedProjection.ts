import {
  isIndexSegment,
  isIndexTuple,
  isKeySegment,
  isReferenceSchemaType,
  type PathSegment,
  type SchemaType,
  type SortOrderingItem,
} from '@sanity/types'
import {fromString as pathFromString} from '@sanity/util/paths'

const IMPLICIT_SCHEMA_TYPE_FIELDS = ['_id', '_type', '_createdAt', '_updatedAt', '_rev']

type ProjectionNode = {
  reference: boolean
  children: Map<string, ProjectionNode>
}

/**
 * Returns an existing child projection node or creates a new one.
 * We use this while walking order paths so repeated paths like
 * `translations.se` + `translations.no` share the same parent node.
 */
function getOrCreateChildNode(
  nodes: Map<string, ProjectionNode>,
  fieldName: string,
  reference: boolean,
): ProjectionNode {
  const node = nodes.get(fieldName)
  if (node) return node
  const createdNode: ProjectionNode = {reference, children: new Map()}
  nodes.set(fieldName, createdNode)
  return createdNode
}

function reportError(message: string, strict: boolean): void {
  if (strict) throw new Error(message)
  console.warn(message)
}

/**
 * Given a resolved node key, field type, and remaining path, inserts into the projection tree.
 * Handles leaf nodes, reference dereferencing, and nested object recursion.
 */
function recurseIntoField(
  nodes: Map<string, ProjectionNode>,
  nodeKey: string,
  fieldType: SchemaType,
  tail: PathSegment[],
  strict: boolean,
): void {
  if (tail.length === 0) {
    if (!nodes.has(nodeKey)) {
      nodes.set(nodeKey, {reference: false, children: new Map()})
    }
    return
  }

  const isReference =
    isReferenceSchemaType(fieldType) || ('to' in fieldType && fieldType.name === 'reference')

  if (isReference && 'to' in fieldType) {
    const refNode = getOrCreateChildNode(nodes, nodeKey, true)
    fieldType.to.forEach((refType) => joinReferences(refNode.children, refType, tail, strict))
    return
  }

  const node = getOrCreateChildNode(nodes, nodeKey, false)
  joinReferences(node.children, fieldType, tail, strict)
}

/**
 * Recursively walks a parsed path against the schema and builds a merged projection tree.
 *
 * Handles three segment types from `PathUtils.fromString`:
 * - **String**: field name lookup (e.g., `author`, `name`)
 * - **Number**: array index (e.g., `[0]`) - folded into parent field's node key
 * - **KeyedSegment**: keyed array access (e.g., `[_key=="abc"]`) - same folding
 *
 * Example (`translations.se`):
 * - first call: `head=translations`, `rest=['se']` - not last segment, recurse into `translations`.
 * - second call: `head=se`, `rest=[]` - last segment, store `se` and stop.
 *
 * Example (`items[0].value` where `items` is an array of references):
 * - `head=items`, `rest=[0, 'value']` - next segment is an index, so consume it.
 * - `nodeKey` becomes `items[0]`, member type is a reference, recurse into ref target.
 * - inner call: `head=value`, `rest=[]` - last segment, store `value` and stop.
 * - final projection: `items[0]->{value}`
 *
 * Because this writes into a shared `nodes` map, overlapping orderings are merged
 * naturally while traversing (instead of being merged afterwards from strings).
 */
function joinReferences(
  nodes: Map<string, ProjectionNode>,
  schemaType: SchemaType,
  path: PathSegment[],
  strict: boolean,
) {
  const [head, ...rest] = path
  if (!head || typeof head !== 'string' || !('fields' in schemaType)) {
    return
  }

  const schemaField = schemaType.fields.find((field) => field.name === head)
  if (!schemaField) {
    if (!IMPLICIT_SCHEMA_TYPE_FIELDS.includes(head)) {
      reportError(
        `The current ordering config targeted the nonexistent field "${head}" on schema type "${schemaType.name}". It should be one of ${schemaType.fields.map((field) => field.name).join(', ')}`,
        strict,
      )
    }
    return
  }

  const nextSegment = rest[0]
  const hasArrayAccessor =
    nextSegment !== undefined &&
    (isIndexSegment(nextSegment) || isKeySegment(nextSegment) || isIndexTuple(nextSegment))

  // When there's no array accessor, use the field directly.
  if (!hasArrayAccessor) {
    recurseIntoField(nodes, head, schemaField.type, rest, strict)
    return
  }

  // Reject range slices like [0:5] - they don't make sense for ordering.
  if (isIndexTuple(nextSegment)) {
    reportError(
      `The current ordering config used a range slice on "${head}" on schema type "${schemaType.name}". Range slices are not supported for ordering.`,
      strict,
    )
    return
  }

  if (schemaField.type.jsonType !== 'array') {
    reportError(
      `The current ordering config used array access on non-array field "${head}" on schema type "${schemaType.name}"`,
      strict,
    )
    return
  }

  const members = (
    'of' in schemaField.type && schemaField.type.of ? schemaField.type.of : []
  ) as SchemaType[]
  if (members.length !== 1) {
    reportError(
      `The current ordering config used array access on multi-type array field "${head}" on schema type "${schemaType.name}". Array ordering requires a single member type.`,
      strict,
    )
    return
  }

  const nodeKey =
    head + (typeof nextSegment === 'number' ? `[${nextSegment}]` : `[_key=="${nextSegment._key}"]`)
  const tail = rest.slice(1)
  const memberType = members[0]

  recurseIntoField(nodes, nodeKey, memberType, tail, strict)
}

/**
 * Recursively creates the projection string.
 *
 * Each map entry is one node (`fieldName - node`):
 * - A node with no children is a leaf and projects as `field`.
 * - A node with children projects itself and then recursively projects its children:
 *   - object node - `field{childProjection}`
 *   - reference node - `field->{childProjection}`
 *
 * Because children are also `ProjectionNode`s, this can recurse to any depth
 * (parent - child - grandchild - ...).
 *
 * Example (`translations.se` + `translations.no`):
 * - tree shape:
 *   - `translations` (object)
 *     - `se` (leaf)
 *     - `no` (leaf)
 * - projection steps:
 *   - projection `se` - `se`
 *   - projection `no` - `no`
 *   - join children - `se, no`
 *   - wrap parent object - `translations{se, no}`
 */
function createProjection(tree: Map<string, ProjectionNode>): string {
  return [...tree.entries()]
    .map(([fieldName, node]) => {
      if (!node.children || node.children.size === 0) {
        return fieldName
      }

      const childrenProjection = createProjection(node.children)
      if (node.reference) {
        return `${fieldName}->{${childrenProjection}}`
      }
      return `${fieldName}{${childrenProjection}}`
    })
    .join(', ')
}

/**
 * Builds the extended projection needed for sorting on nested fields.
 *
 * For each sort field in `orderBy`, we:
 * 1) parse the field path into typed segments (supporting array indices and keyed access)
 * 2) recursively walk the schema and insert into a shared projection tree
 * 3) render the merged tree into a stable projection string
 */
export function getExtendedProjection(
  schemaType: SchemaType,
  orderBy: SortOrderingItem[],
  strict: boolean = false,
): string {
  const nodes = new Map<string, ProjectionNode>()

  orderBy.forEach((ordering) => {
    if (!ordering.field) return
    joinReferences(nodes, schemaType, pathFromString(ordering.field), strict)
  })

  return createProjection(nodes)
}
