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
  User,
  ValidationMarker,
} from '@sanity/types'

import {castArray, pick} from 'lodash'
import React, {ComponentType} from 'react'
import {isEqual, pathFor, startsWith, toString, isSegmentEqual} from '@sanity/util/paths'
import {createProtoValue} from '../utils/createProtoValue'
import {PatchEvent, setIfMissing} from '../patch'
import {FormFieldPresence} from '../../presence'
import {callConditionalProperties, callConditionalProperty} from './conditional-property'
import {
  ArrayFieldProps,
  BooleanFieldProps,
  FieldGroup,
  FieldMember,
  FieldProps,
  NumberFieldProps,
  ObjectMember,
  StateTree,
  StringFieldProps,
} from './types'
import {MAX_FIELD_DEPTH} from './constants'
import {getItemType} from './utils/getItemType'
import {getCollapsedWithDefaults} from './utils/getCollapsibleOptions'

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

/*
 * Takes a field in context of a parent object and returns prepared props for it
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
    (fieldChangeEvent: PatchEvent) => {
      const ensureValue =
        isObjectSchemaType(field.type) || isArraySchemaType(field.type)
          ? [setIfMissing(createProtoValue(field.type))]
          : []
      parent.onChange(fieldChangeEvent.prepend(ensureValue).prefixAll(field.name))
    }
  )

  const fieldOnFocus = getScopedCallbackForPath(parent.onFocus, fieldPath, () =>
    parent.onFocus(fieldPath)
  )

  const fieldOnBlur = getScopedCallbackForPath(parent.onBlur, fieldPath, () =>
    parent.onBlur(fieldPath)
  )
  const scopedPresence = parent.presence.filter((item) => startsWith(fieldPath, item.path))
  const scopedValidation = parent.validation.filter((item) => startsWith(fieldPath, item.path))

  const scopedFocusPath = pathFor(
    parent.focusPath[0] === field.name ? parent.focusPath.slice(1) : []
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
      validation: parent.validation,
      presence: parent.presence,
      path: fieldPath,
      level: fieldLevel,
      focusPath: scopedFocusPath,
      collapsedFields: collapsedFields,
      collapsedFieldSets: collapsedFieldSets,
      onChange: fieldOnChange,
      onFocus: parent.onFocus,
      onBlur: parent.onBlur,
      onSetActiveFieldGroupAtPath: parent.onSetActiveFieldGroupAtPath,
      onSetCollapsedField: parent.onSetCollapsedField,
      onSetCollapsedFieldSet: parent.onSetCollapsedFieldSet,
    })

    if (scopedInputProps.hidden) {
      return {hidden: true}
    }

    const defaultCollapsedState = getCollapsedWithDefaults(field.type.options, fieldLevel)

    const collapsed = collapsedFields ? collapsedFields.value : defaultCollapsedState.collapsible
    const fieldPresence = collapsed
      ? scopedPresence
      : scopedPresence.filter((item) => isEqual(fieldPath, item.path))

    const fieldValidation = collapsed
      ? scopedValidation
      : scopedValidation.filter((item) => isEqual(fieldPath, item.path))

    // note: this is what we actually end up passing down to the individual input components
    return {
      kind: 'object',
      type: field.type,
      name: field.name,
      title: field.type.title,
      description: field.type.description,
      level: fieldLevel,
      id: toString(fieldPath),
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
      focusPath: scopedFocusPath,
      focused: isEqual(fieldPath, parent.focusPath),
      collapsible: defaultCollapsedState.collapsible,
      collapsed,
      presence: fieldPresence,
      validation: fieldValidation,
      onFocus: fieldOnFocus,
      onBlur: fieldOnBlur,
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
      presence: scopedPresence,
      focusPath: scopedFocusPath,
      validation: scopedValidation,
      collapsedFields,
      collapsedFieldSets,
      level: fieldLevel,
      path: fieldPath,
      onChange: fieldOnChange,
      onFocus: parent.onFocus,
      onBlur: parent.onBlur,
      onSetCollapsedField: parent.onSetCollapsedField,
      onSetCollapsedFieldSet: parent.onSetCollapsedFieldSet,
      onSetActiveFieldGroupAtPath: parent.onSetActiveFieldGroupAtPath,
    })

    if (preparedInputProps.hidden) {
      return {hidden: true}
    }

    const fieldPresence = scopedPresence.filter((item) => startsWith(fieldPath, item.path))
    const fieldValidation = scopedValidation.filter((item) => startsWith(fieldPath, item.path))

    const ret: ArrayFieldProps = {
      kind: 'array',
      type: field.type,
      name: field.name,
      id: toString(fieldPath),
      title: field.type.title,
      validation: fieldValidation,
      presence: fieldPresence,
      description: field.type.description,
      level: fieldLevel,
      path: fieldPath,
      focusPath: scopedFocusPath,
      index: index,
      focused: isEqual(parent.focusPath, fieldPath),
      hidden: parent.hidden || preparedInputProps.hidden,
      readOnly: parent.readOnly || preparedInputProps.readOnly,
      members: preparedInputProps.members,
      onChange: fieldOnChange,
      onFocus: fieldOnFocus,
      value: fieldValue,
    }
    return ret
  } else {
    const fieldValue = (parent.value as any)?.[field.name] as undefined | boolean | string | number
    const fieldPresence = scopedPresence.filter((item) => isEqual(fieldPath, item.path))
    const fieldValidation = scopedValidation.filter((item) => isEqual(fieldPath, item.path))

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
      level: fieldLevel,
      index,
      id: toString(fieldPath),
      onChange: fieldOnChange,
      onFocus: fieldOnFocus,
      onBlur: fieldOnBlur,
      focused: isEqual(parent.focusPath, [field.name]),
      presence: fieldPresence,
      validation: fieldValidation,
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
  presence: FormFieldPresence[]
  validation: ValidationMarker[]
  parent?: unknown
  hidden?: boolean
  readOnly?: boolean
  path: Path
  focusPath: Path
  fieldGroupState?: StateTree<string>
  collapsedFields?: StateTree<boolean>
  collapsedFieldSets?: StateTree<boolean>
  onSetCollapsedField: (collapsed: boolean, path: Path) => void
  onSetCollapsedFieldSet: (collapsed: boolean, path: Path) => void
  onSetActiveFieldGroupAtPath: (groupName: string, path: Path) => void
  // nesting level
  level: number
  onChange: (patchEvent: PatchEvent) => void
  onFocus: (path: Path) => void
  onBlur: (path: Path) => void
}

function prepareObjectInputProps<T>(
  props: RawProps<ObjectSchemaType, T>
): ObjectInputProps | {hidden: true} {
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

  const handleSetActiveFieldGroup = getScopedCallbackForPath(
    props.onSetActiveFieldGroupAtPath,
    props.path,
    (groupName: string) => props.onSetActiveFieldGroupAtPath(groupName, props.path)
  )

  const handleFocus = getScopedCallbackForPath(props.onFocus, props.path, () =>
    props.onFocus(props.path)
  )

  const handleBlur = getScopedCallbackForPath(props.onBlur, props.path, () =>
    props.onBlur(props.path)
  )

  const handleSetCollapsed = getScopedCallbackForPath(
    props.onSetCollapsedField,
    props.path,
    (collapsed: boolean) => props.onSetCollapsedField(collapsed, props.path)
  )

  if (props.level === MAX_FIELD_DEPTH) {
    return {
      value: props.value as Record<string, unknown> | undefined,
      readOnly: props.readOnly,
      hidden,
      type: props.type,
      focused: isEqual(props.path, props.focusPath),
      path: props.path,
      focusPath: props.focusPath,
      id: toString(props.path),
      level: props.level,
      members: [],
      groups: [],
      validation: [],
      presence: [],
      onFocus: handleFocus,
      onBlur: handleBlur,
      onChange: props.onChange,
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
    onChange: props.onChange,
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
          key: `field-${fieldProps.name}`,
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
              key: `field-${fieldMember.name}`,
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
        key: `fieldset-${fieldSet.name}`,
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
    value: props.value as Record<string, unknown> | undefined,
    type: props.type,
    readOnly: props.readOnly,
    hidden: props.hidden,
    path: props.path,
    id: toString(props.path),
    level: props.level,
    validation: props.validation,
    focused: isEqual(props.path, props.focusPath),
    focusPath: props.focusPath,
    presence: props.presence,
    onChange: props.onChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onSelectFieldGroup: handleSetActiveFieldGroup,
    onSetCollapsed: handleSetCollapsed,
    members,
    groups,
  }
}

function prepareArrayInputProps<T extends unknown[]>(
  props: RawProps<ArraySchemaType, T>
): ArrayInputProps | {hidden: true} {
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

  const handleChange = getInputOnChangeMemo(props.onChange, (patchEvent: PatchEvent) => {
    props.onChange(patchEvent.prepend([setIfMissing([])]))
  })

  const handleFocus = getScopedCallbackForPath(props.onFocus, props.path, () =>
    props.onFocus(props.path)
  )

  const handleBlur = getScopedCallbackForPath(props.onBlur, props.path, () =>
    props.onBlur(props.path)
  )

  const handleSetCollapsed = getScopedCallbackForPath(
    props.onSetCollapsedField,
    props.path,
    (collapsed: boolean) => props.onSetCollapsedField(collapsed, props.path)
  )

  if (props.level === MAX_FIELD_DEPTH) {
    return {
      value: props.value as T,
      readOnly,
      hidden,
      type: props.type,
      focused: isEqual(props.path, props.focusPath),
      path: props.path,
      id: toString(props.path),
      level: props.level,
      members: [],
      validation: [],
      presence: [],
      onFocus: handleFocus,
      onBlur: handleBlur,
      onChange: handleChange,
      onSetCollapsed: handleSetCollapsed,
    }
  }

  // Todo: improve error handling at the parent level so that the value here is either undefined or an array
  const items = Array.isArray(props.value) ? props.value : []

  // create a members array for the object
  const members = items.map((item, index) => {
    return prepareArrayItemProps({arrayItem: item, parent: props, index})
  })
  return {
    value: props.value as T,
    readOnly,
    hidden,
    type: props.type,
    focused: isEqual(props.path, props.focusPath),
    path: props.path,
    id: toString(props.path),
    level: props.level,
    members,
    validation: props.validation,
    presence: [],
    onFocus: handleFocus,
    onBlur: handleBlur,
    onChange: handleChange,
    onSetCollapsed: handleSetCollapsed,
  }
}
/*
 * Takes a field in context of a parent object and returns prepared props for it
 */
function prepareArrayItemProps(props: {
  arrayItem: unknown
  parent: RawProps<ArraySchemaType, unknown>
  index: number
}): ObjectInputProps | {hidden: true} {
  const {arrayItem, parent, index} = props
  const itemType = getItemType(parent.type, arrayItem)

  if (!isObjectSchemaType(itemType)) {
    // TODO
    // eslint-disable-next-line no-console
    console.log('TODO: Primitive inputs')
    return {hidden: true}
  }

  // todo: validate _key
  const key = (arrayItem as any)?._key

  const itemPath = pathFor([...parent.path, key])
  const itemLevel = parent.level + 1

  const itemOnChange = getScopedCallbackForPath(
    parent.onChange,
    itemPath,
    (itemChangeEvent: PatchEvent) => {
      const ensureValue = isObjectSchemaType(itemType)
        ? [setIfMissing(createProtoValue(itemType))]
        : []
      parent.onChange(itemChangeEvent.prepend(ensureValue).prefixAll({_key: key}))
    }
  )

  const itemOnFocus = getScopedCallbackForPath(parent.onFocus, itemPath, () =>
    parent.onFocus(itemPath)
  )

  const itemOnBlur = getScopedCallbackForPath(parent.onBlur, itemPath, () =>
    parent.onBlur(itemPath)
  )
  const scopedPresence = parent.presence.filter((item) => startsWith(itemPath, item.path))
  const scopedValidation = parent.validation.filter((item) => startsWith(itemPath, item.path))

  const scopedFocusPath = pathFor(
    isSegmentEqual(parent.focusPath[0], {_key: key}) ? parent.focusPath.slice(1) : []
  )

  return prepareObjectInputProps({
    type: itemType,
    onChange: itemOnChange,
    level: itemLevel,
    document: parent.document,
    validation: scopedValidation,
    presence: scopedPresence,
    value: arrayItem,
    path: itemPath,
    focusPath: scopedFocusPath,
    currentUser: parent.currentUser,
    onFocus: itemOnFocus,
    onBlur: itemOnBlur,
    onSetCollapsedField: parent.onSetCollapsedField,
    onSetCollapsedFieldSet: parent.onSetCollapsedFieldSet,
    onSetActiveFieldGroupAtPath: parent.onSetActiveFieldGroupAtPath,
  })
}

export type SanityDocument = Record<string, unknown>

export interface FieldPresence {
  user: User
  sessionId: string
  lastActiveAt: string
}

export interface BaseInputProps<S extends SchemaType, T = unknown> {
  id: string
  type: S
  value: T | undefined
  onChange: (patchEvent: PatchEvent) => void
  hidden?: boolean
  level: number
  readOnly?: boolean
  path: Path
  focused: boolean

  onFocus: (event: React.FocusEvent) => void
  onBlur: (event: React.FocusEvent) => void

  presence: FormFieldPresence[]
  validation: ValidationMarker[]
}

export interface ObjectInputProps
  extends BaseInputProps<ObjectSchemaType, Record<string, unknown>> {
  members: ObjectMember[]
  groups?: FieldGroup[]

  focusPath: Path
  onSelectFieldGroup: (groupName: string) => void
  onSetCollapsed: (collapsed: boolean) => void
  collapsed?: boolean
  collapsible?: boolean
}

export interface ArrayInputProps extends BaseInputProps<ArraySchemaType, unknown[]> {
  members: ObjectInputProps[]
  onSetCollapsed: (collapsed: boolean) => void
  collapsed?: boolean
  collapsible?: boolean
}

export function prepareFormProps<T extends SanityDocument>(
  props: RawProps<ObjectSchemaType, T>
): ObjectInputProps | {hidden: true} {
  return prepareObjectInputProps(props)
}
