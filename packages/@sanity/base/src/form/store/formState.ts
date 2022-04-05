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
import {FieldGroup, FieldMember, FieldProps, ObjectMember} from './types'
import {MAX_FIELD_DEPTH} from './constants'
import {ObjectFieldGroupState} from './formStore'
import {getItemType} from './utils/getItemType'

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

    const fieldState = createObjectInputProps(field.type, {
      ...parentCtx,
      parent: parentCtx.value,
      value: fieldValue,
      fieldGroupState,
      onChange,
      onSetFieldGroupState,
    })

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
  } as FieldProps
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

  const onSetFieldGroup = (groupName: string) => {
    ctx.onSetFieldGroupState({current: groupName, fields: ctx.fieldGroupState?.fields})
  }

  if (ctx.level === MAX_FIELD_DEPTH) {
    return {
      value: ctx.value as T,
      readOnly: hidden || ctx.readOnly,
      hidden: hidden,
      level: ctx.level,
      onChange,
      members: [],
      groups: [],
      onSetFieldGroup,
    }
  }

  const schemaTypeGroupConfig = type.groups || []
  const defaultGroupName = (
    schemaTypeGroupConfig.find((g) => g.default) || schemaTypeGroupConfig[0]
  )?.name

  const groups = schemaTypeGroupConfig.flatMap((group): FieldGroup[] => {
    const groupHidden = callConditionalProperty(group.hidden, conditionalFieldContext)
    const active = group.name === (ctx.fieldGroupState?.current || defaultGroupName)
    return groupHidden
      ? []
      : [
          {
            name: group.name,
            title: group.title,
            icon: group.icon as ComponentType<void>,
            default: group.default,
            active,
          },
        ]
  })

  const activeGroup = groups.find((g) => g.active)!

  const parentCtx = {...ctx, level: ctx.level + 1, hidden, readOnly, onChange}

  // create a members array for the object
  const members = (type.fieldsets || []).flatMap((fieldset, index): ObjectMember[] => {
    if (fieldset.single) {
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
      const fieldSetField = createPropsFromObjectField(field, parentCtx, index)
      return !fieldSetField.hidden && isFieldEnabledByGroupFilter(groups, field, activeGroup)
        ? [
            {
              type: 'field',
              field: fieldSetField,
            },
          ]
        : []
    })

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
    onSetFieldGroup,
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
  onSetFieldGroup: (groupName: string) => void
}

export interface ArrayFormState<T> {
  value: T
  onChange: (patchEvent: PatchEvent) => void
  hidden?: boolean
  level: number
  readOnly?: boolean
  members: ObjectFormState<unknown>[]
}

export function createFormState<T extends SanityDocument>(
  schemaType: ObjectSchemaType,
  ctx: PropsContext<T>
): ObjectFormState<T> {
  return createObjectInputProps(schemaType, ctx)
}
