/* eslint-disable no-else-return */
import {
  ArraySchemaType,
  CurrentUser,
  isArraySchemaType,
  isObjectSchemaType,
  ObjectField,
  ObjectSchemaType,
  Path,
  User,
} from '@sanity/types'

import {castArray, pick} from 'lodash'
import {ComponentType} from 'react'
import {isEqual, pathFor, toString} from '@sanity/util/paths'
import {StateTree} from '../types'
import {callConditionalProperties, callConditionalProperty} from './conditional-property'
import {MAX_FIELD_DEPTH} from './constants'
import {getItemType} from './utils/getItemType'
import {ArrayOfObjectsMember, FieldMember, ObjectMember} from './types/members'
import {ArrayOfObjectsNode, ObjectNode} from './types/nodes'
import {FieldGroupState} from './types/fieldGroupState'
import {getCollapsedWithDefaults} from './utils/getCollapsibleOptions'

function isFieldEnabledByGroupFilter(
  // the groups config for the "enclosing object" type
  groupsConfig: FieldGroupState[],
  field: ObjectField,
  currentGroup: FieldGroupState
) {
  // if there's no group config for the object type, all fields are visible
  if (groupsConfig.length === 0) {
    return true
  }

  return castArray(field.group).includes(currentGroup.name)
}

/*
 * Takes a field in context of a parent object and returns prepared props for it
 */
function prepareFieldState(props: {
  field: ObjectField
  parent: RawState<ObjectSchemaType, unknown>
  index: number
}): FieldMember | null {
  const {parent, field, index} = props
  const fieldPath = pathFor([...parent.path, field.name])
  const fieldLevel = parent.level + 1

  if (isObjectSchemaType(field.type)) {
    const fieldValue = (parent.value as any)?.[field.name] as Record<string, unknown> | undefined

    const fieldGroupState = parent.fieldGroupState?.children?.[field.name]
    const expandedPaths = parent.expandedPaths?.children?.[field.name]
    const collapsedFieldSets = parent.expandedFieldSets?.children?.[field.name]

    const scopedInputProps = prepareObjectInputState({
      type: field.type,
      currentUser: parent.currentUser,
      parent: parent.value,
      document: parent.document,
      value: fieldValue,
      fieldGroupState,
      path: fieldPath,
      level: fieldLevel,
      focusPath: parent.focusPath,
      expandedPaths,
      expandedFieldSets: collapsedFieldSets,
    })

    if (scopedInputProps === null) {
      return null
    }

    return {
      kind: 'field',
      key: `field-${field.name}`,
      name: field.name,
      index: index,

      // note: this is what we actually end up passing down as to the next input component
      field: scopedInputProps,
      // value: fieldValue,
    }
  } else if (isArraySchemaType(field.type)) {
    const fieldValue = (parent.value as any)?.[field.name] as unknown[] | undefined

    const fieldGroupState = parent.fieldGroupState?.children?.[field.name]
    const scopedExpandedPaths = parent.expandedPaths?.children?.[field.name]
    const scopedExpandedFieldSets = parent.expandedFieldSets?.children?.[field.name]

    const preparedInputProps = prepareArrayOfObjectsInputState({
      type: field.type,
      parent: parent.value,
      currentUser: parent.currentUser,
      document: parent.document,
      value: fieldValue,
      fieldGroupState,
      focusPath: parent.focusPath,
      expandedPaths: scopedExpandedPaths,
      expandedFieldSets: scopedExpandedFieldSets,
      level: fieldLevel,
      path: fieldPath,
    })

    if (preparedInputProps === null) {
      return null
    }

    return {
      kind: 'field',
      key: `field-${field.name}`,
      name: field.name,
      index: index,

      // note: this is what we actually end up passing down as to the next input component
      field: preparedInputProps,
    }
  } else {
    const fieldValue = (parent.value as any)?.[field.name] as undefined | boolean | string | number

    // note: we *only* want to call the conditional props here, as it's handled by the prepare<Object|Array>InputProps otherwise
    const fieldConditionalProps = callConditionalProperties(
      field.type,
      {
        value: fieldValue,
        parent: parent.value,
        document: parent.document,
        currentUser: parent.currentUser,
      },
      ['hidden', 'readOnly']
    )

    if (fieldConditionalProps.hidden) {
      return null
    }

    return {
      kind: 'field',
      key: `field-${field.name}`,
      name: field.name,
      index: index,

      field: {
        // note: this is what we actually end up passing down as to the next input component
        path: fieldPath,
        type: field.type,
        compareValue: undefined, // todo
        level: fieldLevel,
        id: toString(fieldPath),
        focused: isEqual(parent.focusPath, [field.name]),
        readOnly: parent.readOnly || fieldConditionalProps.readOnly,
        value: fieldValue,
      },
    }
  }
}

interface RawState<SchemaType, T> {
  type: SchemaType
  value?: T
  document: SanityDocument
  currentUser: Omit<CurrentUser, 'role'>
  parent?: unknown
  hidden?: boolean
  readOnly?: boolean
  path: Path
  focusPath: Path
  fieldGroupState?: StateTree<string>
  expandedPaths?: StateTree<boolean>
  expandedFieldSets?: StateTree<boolean>
  // nesting level
  level: number
}

function prepareObjectInputState<T>(
  props: RawState<ObjectSchemaType, T>,
  enableHiddenCheck?: false
): ObjectNode
function prepareObjectInputState<T>(
  props: RawState<ObjectSchemaType, T>,
  enableHiddenCheck?: true
): ObjectNode | null
function prepareObjectInputState<T>(
  props: RawState<ObjectSchemaType, T>,
  enableHiddenCheck = true
): ObjectNode | null {
  if (props.level === MAX_FIELD_DEPTH) {
    return null
  }

  const conditionalFieldContext = {
    value: props.value,
    parent: props.parent,
    document: props.document,
    currentUser: props.currentUser,
  }

  const {hidden, readOnly} = callConditionalProperties(
    props.type,
    conditionalFieldContext,
    enableHiddenCheck ? ['hidden', 'readOnly'] : ['readOnly']
  )

  if (hidden && enableHiddenCheck) {
    return null
  }

  const schemaTypeGroupConfig = props.type.groups || []
  const defaultGroupName = (
    schemaTypeGroupConfig.find((g) => g.default) || schemaTypeGroupConfig[0]
  )?.name

  const groups = schemaTypeGroupConfig.flatMap((group): FieldGroupState[] => {
    const groupHidden = callConditionalProperty(group.hidden, conditionalFieldContext)
    const selected = group.name === (props.fieldGroupState?.value || defaultGroupName)
    return groupHidden
      ? []
      : [
          {
            name: group.name,
            selected,
          },
        ]
  })

  const selectedGroup = groups.find((group) => group.selected)!

  const parentProps: RawState<ObjectSchemaType, unknown> = {
    ...props,
    hidden,
    readOnly,
  }

  // create a members array for the object
  const members = (props.type.fieldsets || []).flatMap((fieldSet, index): ObjectMember[] => {
    if (fieldSet.single) {
      // "single" means not part of a fieldset
      const fieldState = prepareFieldState({
        field: fieldSet.field,
        parent: parentProps,
        index,
      })
      if (
        fieldState === null ||
        !isFieldEnabledByGroupFilter(groups, fieldSet.field, selectedGroup)
      ) {
        return []
      }
      return [fieldState]
    }

    // actual fieldset
    const fieldsetFieldNames = fieldSet.fields.map((f) => f.name)
    const fieldsetHidden = callConditionalProperty(fieldSet.hidden, {
      currentUser: props.currentUser,
      document: props.document,
      parent: props.value,
      value: pick(props.value, fieldsetFieldNames),
    })

    if (fieldsetHidden) {
      return []
    }

    const fieldsetMembers = fieldSet.fields.flatMap((field): FieldMember[] => {
      const fieldMember = prepareFieldState({
        field,
        parent: parentProps,
        index,
      })
      return fieldMember !== null && isFieldEnabledByGroupFilter(groups, field, selectedGroup)
        ? [fieldMember]
        : []
    })

    // if all members of the fieldset is hidden, the fieldset should effectively also be hidden
    if (fieldsetMembers.length === 0) {
      return []
    }

    return [
      {
        kind: 'fieldSet',
        key: `fieldset-${fieldSet.name}`,
        fieldSet: {
          name: fieldSet.name,
          title: fieldSet.title,
          hidden: false,
          fields: fieldsetMembers,
          collapsible: fieldSet.options?.collapsible,
          collapsed:
            fieldSet.name in (props.expandedFieldSets?.children || {})
              ? props.expandedFieldSets?.children?.[fieldSet.name].value === false
              : fieldSet.options?.collapsed,
        },
      },
    ]
  })

  const defaultCollapsedState = getCollapsedWithDefaults(props.type.options, props.level)

  const collapsed = props.expandedPaths
    ? props.expandedPaths.value === false
    : defaultCollapsedState.collapsed

  return {
    compareValue: undefined,
    value: props.value as Record<string, unknown> | undefined,
    type: props.type,
    readOnly: props.readOnly,
    path: props.path,
    id: toString(props.path),
    level: props.level,
    focused: isEqual(props.path, props.focusPath),
    focusPath: props.focusPath,
    collapsible: defaultCollapsedState.collapsible,
    collapsed: collapsed,
    members,
    groups,
  }
}

function prepareArrayOfObjectsInputState<T extends unknown[]>(
  props: RawState<ArraySchemaType, T>
): ArrayOfObjectsNode | null {
  if (props.level === MAX_FIELD_DEPTH) {
    return null
  }

  const conditionalFieldContext = {
    value: props.value,
    parent: props.parent,
    document: props.document,
    currentUser: props.currentUser,
  }
  const {hidden, readOnly} = callConditionalProperties(props.type, conditionalFieldContext, [
    'hidden',
    'readOnly',
  ])

  if (hidden) {
    return null
  }

  // Todo: improve error handling at the parent level so that the value here is either undefined or an array
  const items = Array.isArray(props.value) ? props.value : []

  // const defaultCollapsedState = getCollapsedWithDefaults(props.type.options, props.level)

  // todo: support this for arrays as well
  const defaultCollapsedState = getCollapsedWithDefaults({}, props.level)

  const collapsed = props.expandedPaths
    ? props.expandedPaths.value === false
    : defaultCollapsedState.collapsed

  return {
    compareValue: undefined,
    value: props.value as T,
    readOnly,
    type: props.type,
    focused: isEqual(props.path, props.focusPath),
    focusPath: props.focusPath,
    path: props.path,
    id: toString(props.path),
    level: props.level,
    collapsible: defaultCollapsedState.collapsible,
    collapsed,
    members: items.flatMap((item, index) =>
      prepareArrayMembers({arrayItem: item, parent: props, index})
    ),
  }
}
/*
 * Takes a field in context of a parent object and returns prepared props for it
 */
function prepareArrayMembers(props: {
  arrayItem: unknown
  parent: RawState<ArraySchemaType, unknown>
  index: number
}): ArrayOfObjectsMember[] {
  const {arrayItem, parent, index} = props
  const itemType = getItemType(parent.type, arrayItem)

  if (!isObjectSchemaType(itemType)) {
    // TODO
    // eslint-disable-next-line no-console
    console.log('TODO: Primitive inputs')
    return []
  }

  // todo: validate _key
  const key = (arrayItem as any)?._key

  const itemPath = pathFor([...parent.path, {_key: key}])
  const itemLevel = parent.level + 1

  const expandedItemPaths = parent.expandedPaths?.children?.[key]

  const result = prepareObjectInputState(
    {
      type: itemType,
      level: itemLevel,
      document: parent.document,
      value: arrayItem,
      path: itemPath,
      focusPath: parent.focusPath,
      currentUser: parent.currentUser,
      expandedPaths: expandedItemPaths,
    },
    false
  )

  return [
    {
      kind: 'item',
      key,
      collapsed: result.collapsed,
      collapsible: true,
      item: {
        ...result,
        // override the default for array items
        collapsed: expandedItemPaths?.value !== true,
      },
    },
  ]
}

export type SanityDocument = Record<string, unknown>

export interface FieldPresence {
  user: User
  sessionId: string
  lastActiveAt: string
}

export function prepareFormProps<T extends SanityDocument>(
  props: RawState<ObjectSchemaType, T>
): ObjectNode | null {
  return prepareObjectInputState(props)
}
