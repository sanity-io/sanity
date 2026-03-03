import {type SchemaType, type SortOrderingItem} from '@sanity/types'

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

/**
 * Recursively walks a dot-path (eg `author.bestFriend.name`) against the schema
 * and builds a merged projection tree.
 *
 * Recursion flow:
 * - `head` is the current path segment, `tail` is the remaining path.
 * - We resolve `head` in the current schema type.
 * - If this is the last path segment (`tail.length === 0`), we store the field and stop.
 * - If `head` is a reference field, we recurse into each `to` type using `tail`.
 * - Otherwise we recurse into the nested object type using `tail`.
 *
 * Example (`translations.se`):
 * - first call: `head=translations`, `tail=['se']` - not last segment, recurse into `translations`.
 * - second call: `head=se`, `tail=[]` - last segment, store `se` and stop.
 *
 * Because this writes into a shared `nodes` map, overlapping orderings are merged
 * naturally while traversing (instead of being merged afterwards from strings).
 */
function joinReferences(
  nodes: Map<string, ProjectionNode>,
  schemaType: SchemaType,
  path: string[],
  strict: boolean,
) {
  const [head, ...tail] = path
  if (!head || !('fields' in schemaType)) {
    return
  }

  const schemaField = schemaType.fields.find((field) => field.name === head)
  if (!schemaField) {
    if (!IMPLICIT_SCHEMA_TYPE_FIELDS.includes(head)) {
      const errorMessage = `The current ordering config targeted the nonexistent field "${head}" on schema type "${schemaType.name}". It should be one of ${schemaType.fields.map((field) => field.name).join(', ')}`
      if (strict) {
        throw new Error(errorMessage)
      } else {
        console.warn(errorMessage)
      }
    }
    return
  }

  if (tail.length === 0) {
    if (!nodes.has(head)) {
      nodes.set(head, {reference: false, children: new Map()})
    }
    return
  }

  if ('to' in schemaField.type && schemaField.type.name === 'reference') {
    const refTypes = getOrCreateChildNode(nodes, head, true)
    schemaField.type.to.forEach((refType) =>
      joinReferences(refTypes.children, refType, tail, strict),
    )
    return
  }

  const node = getOrCreateChildNode(nodes, head, false)
  joinReferences(node.children, schemaField.type, tail, strict)
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
 * 1) split the field path by `.`
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
    joinReferences(nodes, schemaType, ordering.field.split('.'), strict)
  })

  return createProjection(nodes)
}
