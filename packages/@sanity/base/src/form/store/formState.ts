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

const onChangeCache = new WeakMap<object, (patchEvent: PatchEvent) => void>()
function getInputOnChangeMemo<T extends (patchEvent: PatchEvent) => void>(
  parentCallback: object,
  entryIfMissing: T
): T {
  if (!onChangeCache.has(parentCallback)) {
    onChangeCache.set(parentCallback, entryIfMissing)
  }
  return onChangeCache.get(parentCallback)! as T
}

const scopedCallbackCache = new WeakMap<object, WeakMap<Path, (...args: any[]) => any>>()
function getScopedCallbackForPath<T extends (...args: any[]) => any>(
  callback: object,
  path: Path,
  entryIfMissing: T
): T {
  if (!scopedCallbackCache.has(callback)) {
    scopedCallbackCache.set(callback, new WeakMap<Path, T>())
  }
  const entry = scopedCallbackCache.get(callback)!
  if (!entry.has(path)) {
    entry.set(path, entryIfMissing)
  }
  return entry.get(path)! as T
}

/**
 * Takes a field in context of a parent object and returns prepared props for it
 * @param props
 */
function prepareFieldProps(props: {
  field: ObjectField
  parent: RawProps<ObjectSchemaType, unknown>
  index: number
}): FieldProps | {hidden: true} {
  const {parent, field, index} = props
  const fieldPath = pathFor([...parent.path, field.name])
  const fieldLevel = parent.level + 1

  const fieldOnChange = getScopedCallbackForPath(
    parent.onChange,
    fieldPath,
    (fieldChangeEvent: PatchEvent) => parent.onChange(fieldChangeEvent.prefixAll(field.name))
  )

  if (isObjectSchemaType(field.type)) {
    const fieldValue = (parent.value as any)?.[field.name] as Record<string, unknown> | undefined

    const fieldGroupState = parent.fieldGroupState?.children?.[field.name]
    const collapsedFields = parent.collapsedFields?.children?.[field.name]
    const collapsedFieldSets = parent.collapsedFieldSets?.children?.[field.name]

    const scopedInputProps = prepareObjectInputProps({
      type: field.type,
      currentUser: parent.currentUser,
      parent: parent.value,
      document: parent.document,
      value: fieldValue,
      fieldGroupState,
      path: fieldPath,
      level: fieldLevel,
      collapsedFields: collapsedFields,
      collapsedFieldSets: collapsedFieldSets,
      onChange: fieldOnChange,
      onSetActiveFieldGroupAtPath: parent.onSetActiveFieldGroupAtPath,
      onSetCollapsedField: parent.onSetCollapsedField,
      onSetCollapsedFieldSet: parent.onSetCollapsedFieldSet,
    })

    if (scopedInputProps.hidden) {
      return {hidden: true}
    }

    const defaultCollapsedState = getCollapsedWithDefaults(field.type.options, fieldLevel)

    // note: this is what we actually end up passing down to the components
    return {
      kind: 'object',
      type: field.type,
      name: field.name,
      title: field.type.title,
      description: field.type.description,
      level: fieldLevel,
      index: index,
      hidden:
        scopedInputProps.hidden ||
        scopedInputProps.members.every((member) => isMemberHidden(member)),

      // if the "enclosing object" is readOnly, the field should also be readOnly
      readOnly: parent.readOnly || scopedInputProps.readOnly,
      members: scopedInputProps.members,
      groups: scopedInputProps.groups,
      onChange: fieldOnChange,
      path: fieldPath,
      collapsible: defaultCollapsedState.collapsible,
      collapsed: collapsedFields ? collapsedFields.value : defaultCollapsedState.collapsible,

      onSetCollapsed: scopedInputProps.onSetCollapsed,
      onSelectGroup: scopedInputProps.onSelectFieldGroup,

      value: fieldValue,
    }
  } else if (isArraySchemaType(field.type)) {
    const fieldValue = (parent.value as any)?.[field.name] as unknown[] | undefined

    const fieldGroupState = parent.fieldGroupState?.children?.[field.name]
    const collapsedFields = parent.collapsedFields?.children?.[field.name]
    const collapsedFieldSets = parent.collapsedFieldSets?.children?.[field.name]

    const preparedInputProps = prepareArrayInputProps({
      type: field.type,
      parent: parent.value,
      currentUser: parent.currentUser,
      document: parent.document,
      value: fieldValue,
      fieldGroupState,
      collapsedFields,
      collapsedFieldSets,
      level: fieldLevel,
      path: fieldPath,
      onChange: fieldOnChange,
      onSetCollapsedField: parent.onSetCollapsedField,
      onSetCollapsedFieldSet: parent.onSetCollapsedFieldSet,
      onSetActiveFieldGroupAtPath: parent.onSetActiveFieldGroupAtPath,
    })

    if (preparedInputProps.hidden) {
      return {hidden: true}
    }

    const ret: ArrayFieldProps = {
      kind: 'array',
      type: field.type,
      name: field.name,
      title: field.type.title,
      description: field.type.description,
      level: fieldLevel,
      path: fieldPath,
      index: index,
      hidden: parent.hidden || preparedInputProps.hidden,
      readOnly: parent.readOnly || preparedInputProps.readOnly,
      members: preparedInputProps.members,
      onChange: fieldOnChange,
      value: fieldValue,
    }
    return ret
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
      return {hidden: true}
    }

    return {
      kind: getKind(field.type),
      type: field.type,
      name: field.name,
      path: fieldPath,
      title: field.type.title,
      description: field.type.description,
      level: parent.level,
      index: index,
      onChange: fieldOnChange,
      readOnly: parent.readOnly || fieldConditionalProps.readOnly,
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
  onSetActiveFieldGroupAtPath: (groupName: string, path: Path) => void
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

  const handleChange = getInputOnChangeMemo(props.onChange, (patchEvent: PatchEvent) =>
    props.onChange(patchEvent.prepend([setIfMissing(createProtoValue(props.type))]))
  )

  const handleSetActiveFieldGroup = getScopedCallbackForPath(
    props.onSetActiveFieldGroupAtPath,
    props.path,
    (groupName: string) => props.onSetActiveFieldGroupAtPath(groupName, props.path)
  )

  const handleSetCollapsed = getScopedCallbackForPath(
    props.onSetCollapsedField,
    props.path,
    (collapsed: boolean) => props.onSetCollapsedField(collapsed, props.path)
  )

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
        parent: parentProps,
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
        parent: parentProps,
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
          onSetCollapsed: getScopedCallbackForPath(
            props.onSetCollapsedFieldSet,
            pathFor([...props.path, '@@fieldset@@']),
            (collapsed: boolean) => {
              props.onSetCollapsedFieldSet(collapsed, [...props.path, fieldSet.name])
            }
          ),
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
          onSetActiveFieldGroupAtPath: props.onSetActiveFieldGroupAtPath,
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
