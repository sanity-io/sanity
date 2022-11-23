import {isKeySegment, Path} from '@sanity/types'
import {castArray} from 'lodash'
import {
  ArrayOfObjectsFormNode,
  ArrayOfObjectsItemMember,
  FieldMember,
  FieldSetMember,
  ObjectFormNode,
} from '../types'
import {isMemberArrayOfObjects} from '../../members/object/fields/asserters'

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
 * @param state - The form state
 * @param path - The path to open
 *
 * @internal
 */
export function getExpandOperations(state: ObjectFormNode, path: Path): ExpandOperation[] {
  // start at the root and make sure all groups/paths are expanded/activated along the way
  const [fieldName, ...rest] = path

  const fieldsetMember = state.members.find(
    (member): member is FieldSetMember =>
      member.kind === 'fieldSet' &&
      member.fieldSet.members.some(
        (field): field is FieldMember => field.kind === 'field' && field.name === fieldName
      )
  )

  const ops: ExpandOperation[] = [{type: 'expandPath', path}]
  if (fieldsetMember) {
    ops.push({type: 'expandFieldSet', path: fieldsetMember.fieldSet.path})
  }

  const fieldMember = state.members.find(
    (member): member is FieldMember => member.kind === 'field' && member.name === fieldName
  )

  const schemaField = state.schemaType.fields.find((field) => field.name === fieldName)
  const selectedGroupName = state.groups.find((group) => group.selected)?.name
  const inSelectedGroup =
    selectedGroupName &&
    (selectedGroupName === 'all-fields' ||
      (schemaField && castArray(schemaField.group).includes(selectedGroupName)))

  if (!inSelectedGroup) {
    ops.push({type: 'setSelectedGroup', path: state.path, groupName: 'all-fields'})
  }

  if (fieldMember) {
    ops.push({type: 'expandPath', path: fieldMember.field.path})
  }

  if (rest.length === 0) {
    return ops
  }

  if (fieldMember && isMemberArrayOfObjects(fieldMember)) {
    return ops.concat([
      {type: 'expandPath', path: fieldMember.field.path},
      ...expandArrayPath(fieldMember.field, rest),
    ])
  }
  return ops
}

function expandArrayPath(state: ArrayOfObjectsFormNode, path: Path): ExpandOperation[] {
  // start at the root and make sure all groups/paths are expanded/activated along the way
  const [segment, ...rest] = path
  if (!isKeySegment(segment)) {
    throw new Error('Expected path segment to be an object with a _key property')
  }

  const foundMember = state.members.find(
    (member): member is ArrayOfObjectsItemMember => member.key === segment._key
  )

  if (!foundMember) {
    // tried to open a member that does not exist in the form state - it's likely hidden
    return []
  }
  return [{type: 'expandPath', path: path}, ...getExpandOperations(foundMember.item, rest)]
}
