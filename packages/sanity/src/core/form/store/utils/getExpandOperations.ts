import {isKeySegment, Path} from '@sanity/types'
import {castArray} from 'lodash'
import {
  ArrayOfObjectsFormNode,
  ArrayOfObjectsItemMember,
  BaseFormNode,
  FieldMember,
  FieldSetMember,
  ObjectFormNode,
} from '../types'
import {isMemberArrayOfObjects, isMemberObject} from '../../members/object/fields/asserters'
import {ALL_FIELDS_GROUP} from '../constants'
import {isArrayOfObjectsFormNode, isObjectFormNode} from '../types/asserters'

/** @internal */
export interface ExpandPathOperation {
  type: 'expandPath'
  path: Path
}

/** @internal */
export interface ExpandFieldSetOperation {
  type: 'expandFieldSet'
  path: Path
}

/** @internal */
export interface SetActiveGroupOperation {
  type: 'setSelectedGroup'
  path: Path
  groupName: string
}

/** @internal */
export type ExpandOperation =
  | ExpandPathOperation
  | ExpandFieldSetOperation
  | SetActiveGroupOperation

/**
 * This takes a form state and returns a list of operations required to open a node at a particular path
 * @param node - The base form node (i.e. the form state node for the _document_)
 * @param path - The path to open
 *
 * @internal
 */
export function getExpandOperations(node: BaseFormNode, path: Path): ExpandOperation[] {
  return [
    // make sure to expand all intermediate paths
    ...path.map((p, i): ExpandPathOperation => ({type: 'expandPath', path: path.slice(0, i + 1)})),
    // make sure to expand all fieldsets and selects the groups that includes the intermediate nodes
    ...getFieldsetAndFieldGroupOperations(node, path),
  ]
}
function getFieldsetAndFieldGroupOperations(node: BaseFormNode, path: Path) {
  if (path.length === 0) {
    return []
  }

  if (isObjectFormNode(node)) {
    return getObjectFieldsetAndFieldGroupOperations(node, path)
  }
  if (isArrayOfObjectsFormNode(node)) {
    return getArrayFieldsetAndFieldGroupOperations(node, path)
  }
  return []
}

function getObjectFieldsetAndFieldGroupOperations(
  node: ObjectFormNode,
  path: Path,
): (ExpandFieldSetOperation | SetActiveGroupOperation)[] {
  if (path.length === 0) {
    return []
  }
  // extract the field name for the current level we're looking at
  const [fieldName, ...tail] = path

  const fieldsetMember = node._allMembers.find(
    (member): member is FieldSetMember =>
      member.kind === 'fieldSet' &&
      member.fieldSet.members.some(
        (field): field is FieldMember => field.kind === 'field' && field.name === fieldName,
      ),
  )

  // if we found the field in a fieldset we need to recurse into this fieldset's members, otherwise we can use the node's members
  const members = fieldsetMember
    ? fieldsetMember.fieldSet.members
    : // Note: we need to use the internal `_allMembers` array here instead of members since hidden/collapsed members are omitted from members
      node._allMembers

  // look for the field inside the members array
  const fieldMember = members.find(
    (member): member is FieldMember =>
      member !== null && member.kind === 'field' && member.name === fieldName,
  )

  // Group handling
  const schemaField = node.schemaType.fields.find((field) => field.name === fieldName)
  const selectedGroupName = node.groups.find((group) => group.selected)?.name
  const defaultGroupName = (node.schemaType.groups || []).find((group) => group.default)?.name
  const inSelectedGroup =
    selectedGroupName &&
    (selectedGroupName === ALL_FIELDS_GROUP.name ||
      (schemaField && castArray(schemaField.group).includes(selectedGroupName)))

  const ops: (ExpandFieldSetOperation | SetActiveGroupOperation)[] = []

  if (!inSelectedGroup) {
    ops.push({
      type: 'setSelectedGroup',
      path: node.path,
      groupName: defaultGroupName || ALL_FIELDS_GROUP.name,
    })
  }

  if (fieldsetMember) {
    // the field is inside a fieldset, make sure we expand it too
    ops.push({type: 'expandFieldSet', path: fieldsetMember.fieldSet.path})
  }

  if (fieldMember) {
    if (isMemberArrayOfObjects(fieldMember)) {
      ops.push(...getArrayFieldsetAndFieldGroupOperations(fieldMember.field, tail))
    } else if (isMemberObject(fieldMember)) {
      ops.push(...getObjectFieldsetAndFieldGroupOperations(fieldMember.field, tail))
    }
  }

  return ops
}

function getArrayFieldsetAndFieldGroupOperations(
  state: ArrayOfObjectsFormNode,
  path: Path,
): (ExpandFieldSetOperation | SetActiveGroupOperation)[] {
  if (path.length === 0) {
    return []
  }

  // start at the root and make sure all groups/paths are expanded/activated along the way
  const [segment, ...rest] = path
  if (!isKeySegment(segment)) {
    throw new Error('Expected path segment to be an object with a _key property')
  }

  const foundMember = state.members.find(
    (member): member is ArrayOfObjectsItemMember => member.key === segment._key,
  )

  if (!foundMember) {
    // tried to open a member that does not exist in the form state - it's likely hidden
    return []
  }
  return getFieldsetAndFieldGroupOperations(foundMember.item, rest)
}
