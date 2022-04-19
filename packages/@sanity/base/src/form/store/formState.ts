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
  ObjectCollapsedState,
  FieldGroup,
  FieldMember,
  FieldProps,
  NumberFieldProps,
  ObjectFieldGroupState,
  ObjectMember,
  StringFieldProps,
  ArrayFieldProps,
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
  path: Path
}): FieldProps | {hidden: true} {
  if (isObjectSchemaType(props.field.type)) {
    const fieldValue = (props.parentObjectProps.value as any)?.[props.field.name] as
      | Record<string, unknown>
      | undefined

    const fieldGroupState = props.parentObjectProps.fieldGroupState?.fields?.[props.field.name]
    const fieldCollapsedState = props.parentObjectProps.collapsedState?.fields?.[props.field.name]

    const handleChange = (fieldChangeEvent: PatchEvent) =>
      props.parentObjectProps.onChange(fieldChangeEvent.prefixAll(props.field.name))

    const handleSetFieldGroupsState = (innerFieldGroupState: ObjectFieldGroupState) => {
      props.parentObjectProps.onSetFieldGroupState({
        [props.field.name]: innerFieldGroupState,
      })
    }

    const handleSetCollapsedState = (state: ObjectCollapsedState) => {
      props.parentObjectProps.onSetCollapsedState({
        fields: {
          [props.field.name]: state,
        },
      })
    }

    const preparedInputProps = prepareObjectInputProps({
      type: props.field.type,
      currentUser: props.parentObjectProps.currentUser,
      parent: props.parentObjectProps.value,
      document: props.parentObjectProps.document,
      value: fieldValue,
      fieldGroupState,
      path: pathFor([...props.path, props.field.name]),
      level: props.parentObjectProps.level + 1,
      collapsedState: fieldCollapsedState,
      onChange: handleChange,
      onSetFieldGroupState: handleSetFieldGroupsState,
      onSetCollapsedState: handleSetCollapsedState,
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
      path: pathFor([...props.path, props.field.name]),
      collapsible: defaultCollapsedState.collapsible,
      collapsed: fieldCollapsedState
        ? fieldCollapsedState.collapsed
        : defaultCollapsedState.collapsible,

      onCollapse: () => {
        handleSetCollapsedState({collapsed: true})
      },

      onExpand: () => handleSetCollapsedState({collapsed: false}),
      onSelectGroup: (groupName: string) =>
        handleSetFieldGroupsState({...props.parentObjectProps.fieldGroupState, current: groupName}),

      value: fieldValue,
    }
  } else if (isArraySchemaType(props.field.type)) {
    const fieldValue = (props.parentObjectProps.value as any)?.[props.field.name] as
      | unknown[]
      | undefined

    const fieldGroupState = props.parentObjectProps.fieldGroupState?.fields?.[props.field.name]
    const fieldCollapsedState = props.parentObjectProps.collapsedState?.fields?.[props.field.name]

    const handleChange = (fieldChangeEvent: PatchEvent) =>
      props.parentObjectProps.onChange(fieldChangeEvent.prefixAll(props.field.name))

    const handleSetFieldGroupsState = (innerFieldGroupState: ObjectFieldGroupState) => {
      props.parentObjectProps.onSetFieldGroupState({
        [props.field.name]: innerFieldGroupState,
      })
    }

    const handleSetCollapsedState = (state: ObjectCollapsedState) => {
      props.parentObjectProps.onSetCollapsedState({
        fields: {
          [props.field.name]: state,
        },
      })
    }
    const level = props.parentObjectProps.level + 1

    const preparedInputProps = prepareArrayInputProps({
      type: props.field.type,
      parent: props.parentObjectProps.value,
      currentUser: props.parentObjectProps.currentUser,
      document: props.parentObjectProps.document,
      value: fieldValue,
      fieldGroupState,
      collapsedState: fieldCollapsedState,
      level,
      path: pathFor([...props.path, props.field.name]),
      onChange: handleChange,
      onSetFieldGroupState: handleSetFieldGroupsState,
      onSetCollapsedState: handleSetCollapsedState,
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
  fieldGroupState?: ObjectFieldGroupState
  collapsedState?: ObjectCollapsedState
  onSetCollapsedState: (state: ObjectCollapsedState) => void
  // nesting level
  level: number
  onChange: (patchEvent: PatchEvent) => void
  onSetFieldGroupState: (fieldGroupState: ObjectFieldGroupState) => void
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

  const handleSelectFieldGroup = (groupName: string) => {
    props.onSetFieldGroupState({current: groupName, fields: props.fieldGroupState?.fields})
  }

  const handleCollapse = () => {
    props.onSetCollapsedState({
      collapsed: true,
    })
  }

  const handleExpand = () => {
    props.onSetCollapsedState({
      collapsed: false,
    })
  }

  if (props.level === MAX_FIELD_DEPTH) {
    return {
      value: props.value as T,
      readOnly: props.readOnly,
      hidden,
      level: props.level,
      members: [],
      groups: [],
      onChange: handleChange,
      onSelectFieldGroup: handleSelectFieldGroup,
      onExpand: handleExpand,
      onCollapse: handleCollapse,
    }
  }

  const schemaTypeGroupConfig = props.type.groups || []
  const defaultGroupName = (
    schemaTypeGroupConfig.find((g) => g.default) || schemaTypeGroupConfig[0]
  )?.name

  const groups = schemaTypeGroupConfig.flatMap((group): FieldGroup[] => {
    const groupHidden = callConditionalProperty(group.hidden, conditionalFieldContext)
    const selected = group.name === (props.fieldGroupState?.current || defaultGroupName)
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
        path: pathFor([...props.path, fieldSet.field.name]),
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
        path: pathFor([...props.path, field.name]),
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
            fieldSet.name in (props.collapsedState?.fieldSets || {})
              ? props.collapsedState?.fieldSets?.[fieldSet.name]
              : fieldSet.options?.collapsed,
          onCollapse: () => {
            props.onSetCollapsedState({
              fieldSets: {
                [fieldSet.name]: true,
              },
            })
          },
          onExpand: () => {
            props.onSetCollapsedState({
              fieldSets: {
                [fieldSet.name]: false,
              },
            })
          },
        },
      },
    ]
  })

  return {
    value: props.value as T,
    readOnly: props.readOnly,
    hidden: props.hidden,
    level: props.level,
    onChange: handleChange,
    onSelectFieldGroup: handleSelectFieldGroup,
    onExpand: handleExpand,
    onCollapse: handleCollapse,
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
          onSetCollapsedState: props.onSetCollapsedState,
          onSetFieldGroupState: props.onSetFieldGroupState,
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
  members: ObjectMember[]
  groups?: FieldGroup[]
  onSelectFieldGroup: (groupName: string) => void

  collapsed?: boolean
  collapsible?: boolean
  onExpand: () => void
  onCollapse: () => void
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
