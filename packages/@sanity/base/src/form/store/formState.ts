import {
  ArraySchemaType,
  CurrentUser,
  isArraySchemaType,
  isObjectSchemaType,
  ObjectField,
  ObjectSchemaType,
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

function createPropsFromObjectField<T>(
  field: ObjectField,
  parentCtx: PropsContext<T>,
  index: number
): FieldProps {
  const fieldValue = (parentCtx.value as any)?.[field.name]
  const fieldGroupState = parentCtx.fieldGroupState?.fields?.[field.name]

  if (isObjectSchemaType(field.type)) {
    const onChange = (fieldChangeEvent: PatchEvent) =>
      parentCtx.onChange(
        fieldChangeEvent.prepend([setIfMissing(createProtoValue(field.type))]).prefixAll(field.name)
      )

    const onSetFieldGroupState = (innerFieldGroupState: ObjectFieldGroupState) => {
      parentCtx.onSetFieldGroupState({
        ...parentCtx.fieldGroupState,
        fields: {
          ...innerFieldGroupState.fields,
          [field.name]: innerFieldGroupState,
        },
      })
    }

    const onSetFieldCollapsedState = (innerFieldCollapsedState: ObjectCollapsedState) => {
      parentCtx.onSetCollapsedState({
        ...parentCtx.fieldGroupState,
        fields: {
          ...innerFieldCollapsedState.fields,
          [field.name]: innerFieldCollapsedState,
        },
      })
    }

    const fieldState = createObjectInputProps(field.type, {
      ...parentCtx,
      parent: parentCtx.value,
      value: fieldValue,
      fieldGroupState,
      onChange,
      onSetFieldGroupState,
    })

    const collapsibleOpts = getCollapsedWithDefaults(field.type.options, parentCtx.level)

    return {
      kind: 'object',
      type: field.type,
      name: field.name,
      title: field.type.title,
      description: field.type.description,
      level: parentCtx.level,
      index,
      hidden:
        parentCtx.hidden ||
        fieldState.hidden ||
        fieldState.members.every((member) => isMemberHidden(member)),
      readOnly: parentCtx.readOnly || fieldState.readOnly,
      members: fieldState.members,
      groups: fieldState.groups,
      onChange,
      collapsible: collapsibleOpts.collapsible,
      collapsed: collapsibleOpts.collapsed,
      onCollapse: () => onSetFieldCollapsedState({...parentCtx.collapsedState, collapsed: true}),
      onExpand: () => onSetFieldCollapsedState({...parentCtx.collapsedState, collapsed: false}),

      onSelectGroup: (groupName: string) =>
        onSetFieldGroupState({...parentCtx.fieldGroupState, current: groupName}),
      value: fieldValue,
    }
  } else if (isArraySchemaType(field.type)) {
    const onChange = (fieldChangeEvent: PatchEvent) =>
      parentCtx.onChange(fieldChangeEvent.prepend([setIfMissing([])]).prefixAll(field.name))

    const fieldState = createArrayInputProps(field.type, {
      ...parentCtx,
      parent: parentCtx.value,
      value: fieldValue,
      fieldGroupState,
      onChange,
    })

    return {
      kind: 'array',
      type: field.type,
      name: field.name,
      title: field.type.title,
      description: field.type.description,
      level: parentCtx.level,
      index,
      hidden: parentCtx.hidden || fieldState.hidden,
      readOnly: parentCtx.readOnly || fieldState.readOnly,
      members: fieldState.members,
      onChange,
      value: fieldValue,
    }
  }
  const fieldConditionalProps = callConditionalProperties(
    field.type,
    {
      value: fieldValue,
      parent: parentCtx.value,
      document: parentCtx.document,
      currentUser: parentCtx.currentUser,
    },
    ['hidden', 'readOnly']
  )

  return {
    kind: getKind(field.type),
    type: field.type,
    name: field.name,
    title: field.type.title,
    description: field.type.description,
    level: parentCtx.level,
    index,
    hidden: parentCtx.hidden || fieldConditionalProps.hidden,
    readOnly: parentCtx.readOnly || fieldConditionalProps.readOnly,
    onChange: (fieldChangeEvent: PatchEvent) => {
      parentCtx.onChange(fieldChangeEvent.prefixAll(field.name))
    },
    value: fieldValue,
  } as StringFieldProps | NumberFieldProps | BooleanFieldProps
}

function getKind(type: SchemaType): 'object' | 'array' | 'boolean' | 'number' | 'string' {
  return type.jsonType
}

interface PropsContext<T> {
  value?: T
  document?: SanityDocument
  currentUser: Omit<CurrentUser, 'role'>
  parent?: unknown
  hidden?: boolean
  readOnly?: boolean
  fieldGroupState?: ObjectFieldGroupState
  collapsedState?: ObjectCollapsedState
  onSetCollapsedState: (state: ObjectCollapsedState) => void
  // nesting level
  level: number
  onChange: (patchEvent: PatchEvent) => void
  onSetFieldGroupState: (fieldGroupState: ObjectFieldGroupState) => void
}

function createObjectInputProps<T>(
  type: ObjectSchemaType,
  ctx: PropsContext<T>
): ObjectFormState<T> {
  const conditionalFieldContext = {
    value: ctx.value,
    parent: ctx.parent,
    document: ctx.document,
    currentUser: ctx.currentUser,
  }
  const {hidden, readOnly} = callConditionalProperties(type, conditionalFieldContext, [
    'hidden',
    'readOnly',
  ])
  const onChange = (fieldChangeEvent: PatchEvent) => {
    ctx.onChange(fieldChangeEvent.prepend([setIfMissing(createProtoValue(type))]))
  }

  const onSelectFieldGroup = (groupName: string) => {
    ctx.onSetFieldGroupState({current: groupName, fields: ctx.fieldGroupState?.fields})
  }

  const onCollapse = () => {
    ctx.onSetCollapsedState({collapsed: true, fields: ctx.fieldGroupState?.fields})
  }
  const onExpand = () => {
    ctx.onSetCollapsedState({collapsed: false, fields: ctx.fieldGroupState?.fields})
  }

  if (hidden || ctx.level === MAX_FIELD_DEPTH) {
    return {
      value: ctx.value as T,
      readOnly: hidden || ctx.readOnly,
      hidden: hidden,
      level: ctx.level,
      onChange,
      members: [],
      groups: [],
      onSelectFieldGroup,
      onExpand,
      onCollapse,
    }
  }

  const schemaTypeGroupConfig = type.groups || []
  const defaultGroupName = (
    schemaTypeGroupConfig.find((g) => g.default) || schemaTypeGroupConfig[0]
  )?.name

  const groups = schemaTypeGroupConfig.flatMap((group): FieldGroup[] => {
    const groupHidden = callConditionalProperty(group.hidden, conditionalFieldContext)
    const selected = group.name === (ctx.fieldGroupState?.current || defaultGroupName)
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

  const activeGroup = groups.find((group) => group.selected)!

  const parentCtx = {...ctx, level: ctx.level + 1, hidden, readOnly, onChange}

  // create a members array for the object
  const members = (type.fieldsets || []).flatMap((fieldset, index): ObjectMember[] => {
    if (fieldset.single) {
      // "single" means not part of a fieldset
      const field = createPropsFromObjectField(fieldset.field, parentCtx, index)
      return !field.hidden && isFieldEnabledByGroupFilter(groups, fieldset.field, activeGroup)
        ? [
            {
              type: 'field',
              field,
            },
          ]
        : []
    }

    const fieldsetFieldNames = fieldset.fields.map((f) => f.name)
    const fieldsetHidden = callConditionalProperty(fieldset.hidden, {
      currentUser: ctx.currentUser,
      document: ctx.document,
      parent: ctx.value,
      value: pick(ctx.value, fieldsetFieldNames),
    })

    const fieldMembers = fieldset.fields.flatMap((field): FieldMember[] => {
      const fieldMember = createPropsFromObjectField(field, parentCtx, index)
      return !fieldMember.hidden && isFieldEnabledByGroupFilter(groups, field, activeGroup)
        ? [
            {
              type: 'field',
              field: fieldMember,
            },
          ]
        : []
    })

    // if all members of the fieldset is hidden, the fieldset should effectively also be hidden
    if (fieldsetHidden || fieldMembers.every((field) => isMemberHidden(field))) {
      return []
    }

    return [
      {
        type: 'fieldSet',
        fieldSet: {
          name: fieldset.name,
          title: fieldset.title,
          hidden: false,
          fields: fieldMembers,
        },
      },
    ]
  })

  return {
    value: ctx.value as T,
    readOnly: ctx.readOnly,
    hidden: ctx.hidden,
    level: ctx.level,
    onChange,
    onSelectFieldGroup,
    onExpand,
    onCollapse,
    members,
    groups,
  }
}

function createArrayInputProps<T>(type: ArraySchemaType, ctx: PropsContext<T>): ArrayFormState<T> {
  const onChange = (fieldChangeEvent: PatchEvent) => {
    ctx.onChange(fieldChangeEvent.prepend([setIfMissing([])]))
  }

  if (ctx.level === MAX_FIELD_DEPTH) {
    return {
      value: ctx.value as T,
      readOnly: ctx.readOnly,
      level: ctx.level,
      onChange,
      members: [],
    }
  }

  const parentCtx = {...ctx, level: ctx.level + 1, onChange}

  // create a members array for the object
  const members = ((ctx.value as undefined | any[]) || []).flatMap(
    (item, index): ObjectFormState<unknown>[] => {
      const itemType = getItemType(type, item)
      const itemCtx = {...parentCtx, value: item, parent: parentCtx.value}
      if (isObjectSchemaType(itemType)) {
        return [createObjectInputProps(itemType, itemCtx)]
      }
      return [] // todo: primitive arrays
    }
  )

  return {
    value: ctx.value as T,
    readOnly: ctx.readOnly,
    hidden: ctx.hidden,
    level: ctx.level,
    onChange,
    members,
  }
}

export type SanityDocument = Record<string, unknown>

export interface ObjectFormState<T> {
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
  members: ObjectFormState<unknown>[]
}

export function deriveFormState<T extends SanityDocument>(
  schemaType: ObjectSchemaType,
  ctx: PropsContext<T>
): ObjectFormState<T> {
  return createObjectInputProps(schemaType, ctx)
}
