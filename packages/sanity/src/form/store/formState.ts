/* eslint-disable camelcase, no-else-return */

import {
  ArraySchemaType,
  CurrentUser,
  isArraySchemaType,
  isObjectSchemaType,
  ObjectField,
  ObjectSchemaType,
  Path,
  ValidationMarker,
} from '@sanity/types'

import {castArray, pick} from 'lodash'
import {isEqual, pathFor, startsWith, toString, trimChildPath} from '@sanity/util/paths'
import {FIXME} from '../types'
import {FormFieldPresence} from '../../presence'
import {StateTree} from './types/state'
import {callConditionalProperties, callConditionalProperty} from './conditional-property'
import {MAX_FIELD_DEPTH} from './constants'
import {getItemType, getPrimitiveItemType} from './utils/getItemType'
import {
  ArrayOfObjectsMember,
  ArrayOfPrimitivesMember,
  FieldMember,
  ObjectMember,
} from './types/members'
import {ArrayOfObjectsFormNode, ArrayOfPrimitivesFormNode, ObjectFormNode} from './types/nodes'
import {FormFieldGroup} from './types/fieldGroup'
import {getCollapsedWithDefaults} from './utils/getCollapsibleOptions'

const ALL_FIELDS_GROUP = {
  name: 'all-fields',
  title: 'All fields',
  hidden: false,
}

function isFieldEnabledByGroupFilter(
  // the groups config for the "enclosing object" type
  groupsConfig: FormFieldGroup[],
  field: ObjectField,
  currentGroup: FormFieldGroup
) {
  if (currentGroup.name === ALL_FIELDS_GROUP.name) {
    return true
  }

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
    const scopedCollapsedPaths = parent.collapsedPaths?.children?.[field.name]
    const scopedCollapsedFieldsets = parent.collapsedFieldSets?.children?.[field.name]

    const inputState = prepareObjectInputState({
      schemaType: field.type,
      currentUser: parent.currentUser,
      parent: parent.value,
      document: parent.document,
      value: fieldValue,
      presence: parent.presence,
      validation: parent.validation,
      fieldGroupState,
      path: fieldPath,
      level: fieldLevel,
      focusPath: parent.focusPath,
      openPath: parent.openPath,
      collapsedPaths: scopedCollapsedPaths,
      collapsedFieldSets: scopedCollapsedFieldsets,
    })

    if (inputState === null) {
      return null
    }

    return {
      kind: 'field',
      key: `field-${field.name}`,
      name: field.name,
      index: index,
      open: startsWith(fieldPath, parent.openPath),
      collapsible: inputState.collapsible,
      collapsed: inputState.collapsed,
      field: inputState,
    }
  } else if (isArraySchemaType(field.type)) {
    const fieldValue = (parent.value as any)?.[field.name] as unknown[] | undefined

    const fieldGroupState = parent.fieldGroupState?.children?.[field.name]
    const scopedCollapsedPaths = parent.collapsedPaths?.children?.[field.name]
    const scopedCollapsedFieldSets = parent.collapsedFieldSets?.children?.[field.name]

    const inputState = prepareArrayInputState({
      schemaType: field.type,
      parent: parent.value,
      currentUser: parent.currentUser,
      document: parent.document,
      value: fieldValue,
      fieldGroupState,
      focusPath: parent.focusPath,
      openPath: parent.openPath,
      presence: parent.presence,
      validation: parent.validation,
      collapsedPaths: scopedCollapsedPaths,
      collapsedFieldSets: scopedCollapsedFieldSets,
      level: fieldLevel,
      path: fieldPath,
    })

    if (inputState === null) {
      return null
    }

    return {
      kind: 'field',
      key: `field-${field.name}`,
      name: field.name,
      index: index,

      open: startsWith(fieldPath, parent.openPath),

      collapsible: false,
      collapsed: false,
      // note: this is what we actually end up passing down as to the next input component
      field: inputState,
    }
  } else {
    // primitive fields

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

    const presence = parent.presence.filter((item) => isEqual(item.path, fieldPath))

    const validation = parent.validation
      .filter((item) => isEqual(item.path, fieldPath))
      .map((v) => ({level: v.level, message: v.item.message, path: v.path}))

    return {
      kind: 'field',
      key: `field-${field.name}`,
      name: field.name,
      index: index,

      open: startsWith(fieldPath, parent.openPath),
      collapsible: false,
      collapsed: false,
      field: {
        // note: this is what we actually end up passing down as to the next input component
        path: fieldPath,
        schemaType: field.type,
        compareValue: undefined, // todo
        level: fieldLevel,
        id: toString(fieldPath),
        focused: isEqual(parent.focusPath, [field.name]),
        readOnly: parent.readOnly || fieldConditionalProps.readOnly,
        value: fieldValue,
        presence,
        validation,
      },
    }
  }
}

interface RawState<SchemaType, T> {
  schemaType: SchemaType
  value?: T
  document: FIXME_SanityDocument
  currentUser: Omit<CurrentUser, 'role'> | null
  parent?: unknown
  hidden?: boolean
  readOnly?: boolean
  path: Path
  openPath: Path
  focusPath: Path
  presence: FormFieldPresence[]
  validation: ValidationMarker[]
  fieldGroupState?: StateTree<string>
  collapsedPaths?: StateTree<boolean>
  collapsedFieldSets?: StateTree<boolean>
  // nesting level
  level: number
}

function prepareObjectInputState<T>(
  props: RawState<ObjectSchemaType, T>,
  enableHiddenCheck?: false
): ObjectFormNode
function prepareObjectInputState<T>(
  props: RawState<ObjectSchemaType, T>,
  enableHiddenCheck?: true
): ObjectFormNode | null
function prepareObjectInputState<T>(
  props: RawState<ObjectSchemaType, T>,
  enableHiddenCheck = true
): ObjectFormNode | null {
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
    props.schemaType,
    conditionalFieldContext,
    enableHiddenCheck ? ['hidden', 'readOnly'] : ['readOnly']
  )

  if (hidden && enableHiddenCheck) {
    return null
  }

  const schemaTypeGroupConfig = props.schemaType.groups || []
  const defaultGroupName = (schemaTypeGroupConfig.find((g) => g.default) || ALL_FIELDS_GROUP)?.name

  const groups = [ALL_FIELDS_GROUP, ...schemaTypeGroupConfig].flatMap((group): FormFieldGroup[] => {
    const groupHidden = callConditionalProperty(group.hidden, conditionalFieldContext)
    const selected = group.name === (props.fieldGroupState?.value || defaultGroupName)
    return groupHidden
      ? []
      : [
          {
            name: group.name,
            title: group.title,
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

  // note: this is needed because not all object types gets a ´fieldsets´ property during schema parsing.
  // ideally members should be normalized as part of the schema parsing and not here
  const normalizedSchemaMembers: typeof props.schemaType.fieldsets = props.schemaType.fieldsets
    ? props.schemaType.fieldsets
    : props.schemaType.fields.map((field) => ({single: true, field}))

  // create a members array for the object
  const members = normalizedSchemaMembers.flatMap((fieldSet, index): ObjectMember[] => {
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

    // it's an actual fieldset
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
      const fieldState = prepareFieldState({
        field,
        parent: parentProps,
        index,
      })
      if (fieldState === null || !isFieldEnabledByGroupFilter(groups, field, selectedGroup)) {
        return []
      }
      return [fieldState]
    })

    // if all members of the fieldset is hidden, the fieldset should effectively also be hidden
    if (fieldsetMembers.length === 0) {
      return []
    }

    const collapsed =
      (props.collapsedFieldSets?.children || {})[fieldSet.name]?.value ??
      fieldSet.options?.collapsed

    return [
      {
        kind: 'fieldSet',
        key: `fieldset-${fieldSet.name}`,
        fieldSet: {
          path: pathFor(props.path.concat(fieldSet.name)),
          name: fieldSet.name,
          title: fieldSet.title,
          description: fieldSet.description,
          hidden: false,
          level: props.level + 1,
          fields: fieldsetMembers,
          collapsible: fieldSet.options?.collapsible,
          collapsed,
        },
      },
    ]
  })

  const hasFieldGroups = schemaTypeGroupConfig.length > 0

  const presence = props.presence.filter((item) => isEqual(item.path, props.path))

  const validation = props.validation
    .filter((item) => isEqual(item.path, props.path))
    .map((v) => ({level: v.level, message: v.item.message, path: v.path}))

  return {
    compareValue: undefined,
    value: props.value as Record<string, unknown> | undefined,
    schemaType: props.schemaType,
    readOnly: props.readOnly,
    path: props.path,
    id: toString(props.path),
    level: props.level,
    focused: isEqual(props.path, props.focusPath),
    focusPath: trimChildPath(props.path, props.focusPath),
    presence,
    validation,
    members,
    groups: hasFieldGroups ? groups : [],
  }
}

function prepareArrayInputState<T extends unknown[]>(
  props: RawState<ArraySchemaType, T>
): ArrayOfObjectsFormNode | ArrayOfPrimitivesFormNode | null {
  if (props.level === MAX_FIELD_DEPTH) {
    return null
  }

  const conditionalFieldContext = {
    value: props.value,
    parent: props.parent,
    document: props.document,
    currentUser: props.currentUser,
  }
  const {hidden, readOnly} = callConditionalProperties(props.schemaType, conditionalFieldContext, [
    'hidden',
    'readOnly',
  ])

  if (hidden) {
    return null
  }

  // Todo: improve error handling at the parent level so that the value here is either undefined or an array
  const items = Array.isArray(props.value) ? props.value : []

  // todo: guard against mixed arrays
  const isArrayOfObjects = props.schemaType.of.every((memberType) => isObjectSchemaType(memberType))
  const prepareMember = isArrayOfObjects
    ? prepareArrayOfObjectsMember
    : prepareArrayOfPrimitivesMember

  const defaultCollapsedState = getCollapsedWithDefaults(
    props.schemaType.options as FIXME,
    props.level
  )
  const collapsed = props.collapsedPaths
    ? props.collapsedPaths.value
    : defaultCollapsedState.collapsed

  const presence = props.presence.filter((item) => isEqual(item.path, props.path))
  const validation = props.validation
    .filter((item) => isEqual(item.path, props.path))
    .map((v) => ({level: v.level, message: v.item.message, path: v.path}))

  return {
    compareValue: undefined,
    value: props.value as T,
    readOnly,
    schemaType: props.schemaType,
    focused: isEqual(props.path, props.focusPath),
    focusPath: trimChildPath(props.path, props.focusPath),
    path: props.path,
    id: toString(props.path),
    level: props.level,
    collapsed,
    collapsible: defaultCollapsedState.collapsible,
    validation,
    presence,
    members: items.flatMap(
      (item, index) => prepareMember({arrayItem: item, parent: props, index}) as FIXME
    ),
  }
}

/*
 * Takes a field in context of a parent object and returns prepared props for it
 */
function prepareArrayOfObjectsMember(props: {
  arrayItem: unknown
  parent: RawState<ArraySchemaType, unknown>
  index: number
}): ArrayOfObjectsMember[] {
  const {arrayItem, parent, index} = props
  const itemType = getItemType(parent.schemaType, arrayItem)

  // todo: more graceful handling of this
  if (!itemType) {
    throw new Error('Item type not allowed by the array type schema definition')
  }

  if (!isObjectSchemaType(itemType)) {
    throw new Error('Unexpected non-object schema type included in array')
  }

  // todo: validate _key
  const key = (arrayItem as any)?._key

  const itemPath = pathFor([...parent.path, {_key: key}])
  const itemLevel = parent.level + 1

  const collapsedItemPaths = parent.collapsedPaths?.children?.[key]

  const result = prepareObjectInputState(
    {
      schemaType: itemType,
      level: itemLevel,
      document: parent.document,
      value: arrayItem,
      path: itemPath,
      focusPath: parent.focusPath,
      openPath: parent.openPath,
      currentUser: parent.currentUser,
      collapsedPaths: collapsedItemPaths,
      presence: parent.presence,
      validation: parent.validation,
    },
    false
  )

  const defaultCollapsedState = getCollapsedWithDefaults(itemType.options, itemLevel)
  const collapsed = collapsedItemPaths?.value ?? defaultCollapsedState.collapsed
  return [
    {
      kind: 'item',
      key,
      index,
      open: startsWith(itemPath, parent.openPath),
      collapsed: collapsed,
      collapsible: true,
      item: result,
    },
  ]
}

/*
 * Takes a field in context of a parent object and returns prepared props for it
 */
function prepareArrayOfPrimitivesMember(props: {
  arrayItem: unknown
  parent: RawState<ArraySchemaType, unknown>
  index: number
}): ArrayOfPrimitivesMember[] {
  const {arrayItem, parent, index} = props
  const itemType = getPrimitiveItemType(parent.schemaType, arrayItem)

  // todo: more graceful handling of this
  if (!itemType) {
    throw new Error('Item type not allowed by the array type schema definition')
  }

  const itemPath = pathFor([...parent.path, index])
  const itemValue = (parent.value as unknown[] | undefined)?.[index] as string | boolean | number
  const itemLevel = parent.level + 1
  return [
    {
      kind: 'item',
      key: String(index),
      index,
      open: isEqual(itemPath, parent.openPath),
      item: {
        compareValue: undefined,
        level: itemLevel,
        id: toString(itemPath),
        readOnly: false, // todo
        focused: isEqual(parent.path, parent.focusPath),
        path: itemPath,
        presence: [], // todo
        validation: [], // todo
        schemaType: itemType as FIXME,
        value: itemValue as FIXME,
      },
    },
  ]
}

export type FIXME_SanityDocument = Record<string, unknown>

export function prepareFormState<T extends FIXME_SanityDocument>(
  props: RawState<ObjectSchemaType, T>
): ObjectFormNode | null {
  return prepareObjectInputState(props)
}
