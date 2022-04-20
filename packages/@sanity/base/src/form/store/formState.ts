/* eslint-disable no-else-return */
import {
  ArraySchemaType,
  CurrentUser,
  isArraySchemaType,
  isObjectSchemaType,
  ObjectField,
  ObjectSchemaType,
  Path,
  SchemaType,
} from '@sanity/types'

import {pick, castArray} from 'lodash'
import {ComponentType} from 'react'
import {createProtoValue} from '../utils/createProtoValue'
import {PatchEvent, setIfMissing} from '../patch'
import {callConditionalProperties, callConditionalProperty} from './conditional-property'
import {
  BooleanFieldProps,
  FieldGroup,
  FieldMember,
  FieldProps,
  NumberFieldProps,
  ObjectMember,
  StringFieldProps,
  ArrayFieldProps,
  StateTree,
} from './types'
import {MAX_FIELD_DEPTH} from './constants'
import {getItemType} from './utils/getItemType'
import {getCollapsedWithDefaults} from './utils/getCollapsibleOptions'
import {pathFor} from '@sanity/util/paths'

function isFieldEnabledByGroupFilter(
  // the groups config for the "enclosing object" type
  groupsConfig: FieldGroup[],
  field: ObjectField,
  currentGroup: FieldGroup
) {
  // if there's no group config for the object type, all fields are visible
  if (groupsConfig.length === 0) {
    return true
  }

  return castArray(field.group).includes(currentGroup.name)
}

function isMemberHidden(member: ObjectMember) {
  return member.type === 'field' ? member.field.hidden : member.fieldSet.hidden
}

/**
 * Takes a field in context of a parent object and returns prepared props for it
 * @param props
 */
function prepareFieldProps(props: {
  field: ObjectField
  parentObjectProps: RawProps<ObjectSchemaType, unknown>
  index: number
}): FieldProps | {hidden: true} {
  const fieldPath = pathFor([...props.parentObjectProps.path, props.field.name])

  if (isObjectSchemaType(props.field.type)) {
    const fieldValue = (props.parentObjectProps.value as any)?.[props.field.name] as
      | Record<string, unknown>
      | undefined

    const fieldGroupState = props.parentObjectProps.fieldGroupState?.children?.[props.field.name]
    const collapsedFields = props.parentObjectProps.collapsedFields?.children?.[props.field.name]
    const collapsedFieldSets =
      props.parentObjectProps.collapsedFieldSets?.children?.[props.field.name]

    const handleChange = (fieldChangeEvent: PatchEvent) =>
      props.parentObjectProps.onChange(fieldChangeEvent.prefixAll(props.field.name))

    const handleSetActiveFieldGroup = (groupName: string) => {
      props.parentObjectProps.onSetActiveFieldGroup(groupName, fieldPath)
    }

    const handleSetCollapsedField = (collapsed: boolean, childPath: Path) => {
      props.parentObjectProps.onSetCollapsedField(collapsed, [props.field.name, ...childPath])
    }

    const handleSetCollapsedFieldSet = (collapsed: boolean, childPath: Path) => {
      props.parentObjectProps.onSetCollapsedFieldSet(collapsed, [props.field.name, ...childPath])
    }

    const preparedInputProps = prepareObjectInputProps({
      type: props.field.type,
      currentUser: props.parentObjectProps.currentUser,
      parent: props.parentObjectProps.value,
      document: props.parentObjectProps.document,
      value: fieldValue,
      fieldGroupState,
      path: fieldPath,
      level: props.parentObjectProps.level + 1,
      collapsedFields: collapsedFields,
      collapsedFieldSets: collapsedFieldSets,
      onChange: handleChange,
      onSetActiveFieldGroup: handleSetActiveFieldGroup,
      onSetCollapsedField: handleSetCollapsedField,
      onSetCollapsedFieldSet: handleSetCollapsedFieldSet,
    })

    if (preparedInputProps.hidden) {
      return {hidden: true}
    }

    const level = props.parentObjectProps.level + 1

    const defaultCollapsedState = getCollapsedWithDefaults(props.field.type.options, level)

    return {
      kind: 'object',
      type: props.field.type,
      name: props.field.name,
      title: props.field.type.title,
      description: props.field.type.description,
      level: props.parentObjectProps.level,
      index: props.index,
      hidden:
        preparedInputProps.hidden ||
        preparedInputProps.members.every((member) => isMemberHidden(member)),

      // if the "enclosing object" is readOnly, the field should also be readOnly
      readOnly: props.parentObjectProps.readOnly || preparedInputProps.readOnly,
      members: preparedInputProps.members,
      groups: preparedInputProps.groups,
      onChange: handleChange,
      path: fieldPath,
      collapsible: defaultCollapsedState.collapsible,
      collapsed: collapsedFields ? collapsedFields.value : defaultCollapsedState.collapsible,

      onSetCollapsed: (collapsed: boolean) => handleSetCollapsedField(collapsed, []),
      onSelectGroup: (groupName: string) => handleSetActiveFieldGroup(groupName),

      value: fieldValue,
    }
  } else if (isArraySchemaType(props.field.type)) {
    const fieldValue = (props.parentObjectProps.value as any)?.[props.field.name] as
      | unknown[]
      | undefined
    const fieldGroupState = props.parentObjectProps.fieldGroupState?.children?.[props.field.name]
    const collapsedFields = props.parentObjectProps.collapsedFields?.children?.[props.field.name]
    const collapsedFieldSets =
      props.parentObjectProps.collapsedFieldSets?.children?.[props.field.name]

    const handleSetActiveFieldGroup = (groupName: string) => {
      props.parentObjectProps.onSetActiveFieldGroup(groupName, fieldPath)
    }

    const handleSetCollapsedField = (collapsed: boolean, childPath: Path) => {
      props.parentObjectProps.onSetCollapsedField(collapsed, [props.field.name, ...childPath])
    }
    const handleSetCollapsedFieldSet = (collapsed: boolean, childPath: Path) => {
      props.parentObjectProps.onSetCollapsedFieldSet(collapsed, [props.field.name, ...childPath])
    }

    const handleChange = (fieldChangeEvent: PatchEvent) =>
      props.parentObjectProps.onChange(fieldChangeEvent.prefixAll(props.field.name))

    const level = props.parentObjectProps.level + 1

    const preparedInputProps = prepareArrayInputProps({
      type: props.field.type,
      parent: props.parentObjectProps.value,
      currentUser: props.parentObjectProps.currentUser,
      document: props.parentObjectProps.document,
      value: fieldValue,
      fieldGroupState,
      collapsedFields,
      collapsedFieldSets,
      level,
      path: fieldPath,
      onChange: handleChange,
      onSetCollapsedField: handleSetCollapsedField,
      onSetCollapsedFieldSet: handleSetCollapsedFieldSet,
      onSetActiveFieldGroup: handleSetActiveFieldGroup,
    })

    if (preparedInputProps.hidden) {
      return {hidden: true}
    }

    const ret: ArrayFieldProps = {
      kind: 'array',
      type: props.field.type,
      name: props.field.name,
      title: props.field.type.title,
      description: props.field.type.description,
      level,
      path: fieldPath,
      index: props.index,
      hidden: props.parentObjectProps.hidden || preparedInputProps.hidden,
      readOnly: props.parentObjectProps.readOnly || preparedInputProps.readOnly,
      members: preparedInputProps.members,
      onChange: handleChange,
      value: fieldValue,
    }
    return ret
  } else {
    const fieldValue = (props.parentObjectProps.value as any)?.[props.field.name] as
      | undefined
      | boolean
      | string
      | number

    // note: we *only* want to call the conditional props here, as it's handled by the prepare<Object|Array>InputProps otherwise
    const fieldConditionalProps = callConditionalProperties(
      props.field.type,
      {
        value: fieldValue,
        parent: props.parentObjectProps.value,
        document: props.parentObjectProps.document,
        currentUser: props.parentObjectProps.currentUser,
      },
      ['hidden', 'readOnly']
    )

    if (fieldConditionalProps.hidden) {
      return {hidden: true}
    }

    const handleChange = (fieldChangeEvent: PatchEvent) =>
      props.parentObjectProps.onChange(fieldChangeEvent.prefixAll(props.field.name))

    return {
      kind: getKind(props.field.type),
      type: props.field.type,
      name: props.field.name,
      path: fieldPath,
      title: props.field.type.title,
      description: props.field.type.description,
      level: props.parentObjectProps.level,
      index: props.index,
      onChange: handleChange,
      readOnly: props.parentObjectProps.readOnly || fieldConditionalProps.readOnly,
      value: fieldValue,
    } as StringFieldProps | NumberFieldProps | BooleanFieldProps
  }
}

function getKind(type: SchemaType): 'object' | 'array' | 'boolean' | 'number' | 'string' {
  return type.jsonType
}

interface RawProps<SchemaType, T> {
  type: SchemaType
  value?: T
  document: SanityDocument
  currentUser: Omit<CurrentUser, 'role'>
  parent?: unknown
  hidden?: boolean
  readOnly?: boolean
  path: Path
  fieldGroupState?: StateTree<string>
  collapsedFields?: StateTree<boolean>
  collapsedFieldSets?: StateTree<boolean>
  onSetCollapsedField: (collapsed: boolean, path: Path) => void
  onSetCollapsedFieldSet: (collapsed: boolean, path: Path) => void
  onSetActiveFieldGroup: (groupName: string, path: Path) => void
  // nesting level
  level: number
  onChange: (patchEvent: PatchEvent) => void
}

function prepareObjectInputProps<T>(
  props: RawProps<ObjectSchemaType, T>
): PreparedProps<T> | {hidden: true} {
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
    return {hidden: true}
  }

  const handleChange = (patchEvent: PatchEvent) => {
    props.onChange(patchEvent.prepend([setIfMissing(createProtoValue(props.type))]))
  }

  const handleSetActiveFieldGroup = (groupName: string) => {
    props.onSetActiveFieldGroup(groupName, props.path)
  }

  const handleSetCollapsed = (collapsed: boolean) => {
    props.onSetCollapsedField(collapsed, [])
  }

  if (props.level === MAX_FIELD_DEPTH) {
    return {
      value: props.value as T,
      readOnly: props.readOnly,
      hidden,
      path: props.path,
      level: props.level,
      members: [],
      groups: [],
      onChange: handleChange,
      onSelectFieldGroup: handleSetActiveFieldGroup,
      onSetCollapsed: handleSetCollapsed,
    }
  }

  const schemaTypeGroupConfig = props.type.groups || []
  const defaultGroupName = (
    schemaTypeGroupConfig.find((g) => g.default) || schemaTypeGroupConfig[0]
  )?.name

  const groups = schemaTypeGroupConfig.flatMap((group): FieldGroup[] => {
    const groupHidden = callConditionalProperty(group.hidden, conditionalFieldContext)
    const selected = group.name === (props.fieldGroupState?.value || defaultGroupName)
    return groupHidden
      ? []
      : [
          {
            name: group.name,
            title: group.title,
            icon: group.icon as ComponentType<void>,
            default: group.default,
            selected,
          },
        ]
  })

  const selectedGroup = groups.find((group) => group.selected)!

  const parentProps: RawProps<ObjectSchemaType, unknown> = {
    ...props,
    level: props.level + 1,
    hidden,
    readOnly,
    onChange: handleChange,
  }

  // create a members array for the object
  const members = (props.type.fieldsets || []).flatMap((fieldSet, index): ObjectMember[] => {
    if (fieldSet.single) {
      // "single" means not part of a fieldset
      const fieldProps = prepareFieldProps({
        field: fieldSet.field,
        parentObjectProps: parentProps,
        index,
      })
      if (
        fieldProps.hidden ||
        !isFieldEnabledByGroupFilter(groups, fieldSet.field, selectedGroup)
      ) {
        return []
      }
      return [
        {
          type: 'field',
          field: fieldProps,
        },
      ]
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
      const fieldMember = prepareFieldProps({
        field,
        parentObjectProps: parentProps,
        index,
      })
      return !fieldMember.hidden && isFieldEnabledByGroupFilter(groups, field, selectedGroup)
        ? [
            {
              type: 'field',
              field: fieldMember,
            },
          ]
        : []
    })

    // if all members of the fieldset is hidden, the fieldset should effectively also be hidden
    if (fieldsetMembers.every((field) => isMemberHidden(field))) {
      return []
    }

    return [
      {
        type: 'fieldSet',
        fieldSet: {
          name: fieldSet.name,
          title: fieldSet.title,
          hidden: false,
          fields: fieldsetMembers,
          collapsible: fieldSet.options?.collapsible,
          collapsed:
            fieldSet.name in (props.collapsedFieldSets?.children || {})
              ? props.collapsedFieldSets?.children?.[fieldSet.name].value
              : fieldSet.options?.collapsed,
          onSetCollapsed: (collapsed: boolean) => {
            props.onSetCollapsedFieldSet(collapsed, [fieldSet.name])
          },
        },
      },
    ]
  })

  return {
    value: props.value as T,
    readOnly: props.readOnly,
    hidden: props.hidden,
    path: props.path,
    level: props.level,
    onChange: handleChange,
    onSelectFieldGroup: handleSetActiveFieldGroup,
    onSetCollapsed: handleSetCollapsed,
    members,
    groups,
  }
}

function prepareArrayInputProps<T>(props: RawProps<ArraySchemaType, T>): ArrayFormState<T> {
  const handleChange = (fieldChangeEvent: PatchEvent) => {
    props.onChange(fieldChangeEvent.prepend([setIfMissing([])]))
  }

  if (props.level === MAX_FIELD_DEPTH) {
    return {
      value: props.value as T,
      readOnly: props.readOnly,
      level: props.level,
      onChange: handleChange,
      members: [],
    }
  }

  // create a members array for the object
  const members = ((props.value as undefined | unknown[]) || []).flatMap(
    (item, index): PreparedProps<unknown>[] => {
      const itemType = getItemType(props.type, item)
      if (isObjectSchemaType(itemType)) {
        const key = (item as any)?._key
        const itemProps = {
          type: itemType,
          onChange: handleChange,
          level: props.level + 1,
          document: props.document,
          value: item,
          path: pathFor([...props.path, key]),
          currentUser: props.currentUser,
          onSetCollapsedField: props.onSetCollapsedField,
          onSetCollapsedFieldSet: props.onSetCollapsedFieldSet,
          onSetActiveFieldGroup: props.onSetActiveFieldGroup,
        }
        const prepared = prepareObjectInputProps(itemProps)
        return prepared.hidden ? [] : [prepared]
      }
      return [] // todo: primitive arrays
    }
  )

  return {
    value: props.value as T,
    readOnly: props.readOnly,
    hidden: props.hidden,
    level: props.level,
    onChange: handleChange,
    members,
  }
}

export type SanityDocument = Record<string, unknown>

export interface PreparedProps<T> {
  value: T
  onChange: (patchEvent: PatchEvent) => void
  hidden?: boolean
  level: number
  readOnly?: boolean
  path: Path
  members: ObjectMember[]
  groups?: FieldGroup[]
  onSelectFieldGroup: (groupName: string) => void
  onSetCollapsed: (collapsed: boolean) => void

  collapsed?: boolean
  collapsible?: boolean
}

export interface ArrayFormState<T> {
  value: T
  onChange: (patchEvent: PatchEvent) => void
  hidden?: boolean
  level: number
  readOnly?: boolean
  members: PreparedProps<unknown>[]
}

export function prepareFormProps<T extends SanityDocument>(
  props: RawProps<ObjectSchemaType, T>
): PreparedProps<T> | {hidden: true} {
  return prepareObjectInputProps(props)
}
