/* eslint-disable react/jsx-handler-names */
import {
  ArraySchemaType,
  isBooleanSchemaType,
  NumberSchemaType,
  ReferenceSchemaType,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import React from 'react'
import {FieldMember} from '../../store'
import {
  ArrayFieldProps,
  FieldProps,
  FIXME,
  InputProps,
  ItemProps,
  ObjectFieldProps,
} from '../../types'
import * as is from '../../utils/is'
import {FormField, FormFieldSet} from '../../components/formField'
import {PreviewProps} from '../../../components/previews'
import {SanityPreview} from '../../../preview'
import {resolveReferenceInput} from './resolveReferenceInput'
import {resolveArrayInput} from './resolveArrayInput'
import {resolveStringInput} from './resolveStringInput'
import {resolveNumberInput} from './resolveNumberInput'
import {defaultInputs} from './defaultInputs'
import {getArrayFieldLevel, getObjectFieldLevel} from './helpers'
import {isObjectField} from '../../utils/asserters'

function resolveComponentFromTypeVariants(
  type: SchemaType
): React.ComponentType<FIXME> | undefined {
  if (is.type('array', type)) {
    return resolveArrayInput(type as ArraySchemaType)
  }

  if (is.type('reference', type)) {
    return resolveReferenceInput(type as ReferenceSchemaType)
  }

  // String input with a select
  if (is.type('string', type)) {
    return resolveStringInput(type as StringSchemaType)
  }

  if (is.type('number', type)) {
    return resolveNumberInput(type as NumberSchemaType)
  }

  return undefined
}

function getTypeChain(type: SchemaType | undefined, visited: Set<SchemaType>): SchemaType[] {
  if (!type) return []
  if (visited.has(type)) return []

  visited.add(type)

  const next = type.type ? getTypeChain(type.type, visited) : []
  return [type, ...next]
}

export function defaultResolveInputComponent(
  schemaType: SchemaType
): React.ComponentType<InputProps> {
  if (schemaType.components?.input) return schemaType.components.input

  const componentFromTypeVariants = resolveComponentFromTypeVariants(schemaType)
  if (componentFromTypeVariants) {
    return componentFromTypeVariants
  }

  const typeChain = getTypeChain(schemaType, new Set())
  const deduped = typeChain.reduce((acc, type) => {
    acc[type.name] = type
    return acc
  }, {} as Record<string, SchemaType>)

  // using an object + Object.values to de-dupe the type chain by type name
  const subType = Object.values(deduped).find((t) => defaultInputs[t.name])

  if (subType) {
    return defaultInputs[subType.name]
  }

  throw new Error(`Could not find input component for schema type \`${schemaType.name}\``)
}

function NoopField({children}: {children: React.ReactNode}) {
  return <>{children}</>
}

function PrimitiveField(field: FieldProps) {
  return (
    <FormField
      data-testid={`field-${field.inputId}`}
      level={field.level}
      title={field.title}
      description={field.description}
      validation={field.validation}
      __unstable_presence={field.presence}
    >
      {field.children}
    </FormField>
  )
}

function ObjectOrArrayField(field: ObjectFieldProps | ArrayFieldProps) {
  const level = isObjectField(field) ? getObjectFieldLevel(field) : getArrayFieldLevel(field)

  return (
    <FormFieldSet
      data-testid={`field-${field.inputId}`}
      level={level}
      title={field.title}
      description={field.description}
      collapsed={field.collapsed}
      collapsible={field.collapsible}
      onCollapse={field.onCollapse}
      onExpand={field.onExpand}
      validation={field.validation}
      __unstable_presence={field.presence}
    >
      {field.children}
    </FormFieldSet>
  )
}

function ImageOrFileField(field: ObjectFieldProps) {
  // unless the hotspot tool dialog is open we want to show whoever is in there as the field presence
  const hotspotField = field.inputProps.members.find(
    (member): member is FieldMember => member.kind === 'field' && member.name === 'hotspot'
  )
  const presence = hotspotField?.open
    ? field.presence
    : field.presence.concat(hotspotField?.field.presence || [])

  const level = getObjectFieldLevel(field)

  return (
    <FormFieldSet
      level={level}
      title={field.title}
      description={field.description}
      collapsed={field.collapsed}
      collapsible={field.collapsible}
      onCollapse={field.onCollapse}
      onExpand={field.onExpand}
      validation={field.validation}
      __unstable_presence={presence}
    >
      {field.children}
    </FormFieldSet>
  )
}

export function defaultResolveFieldComponent(
  schemaType: SchemaType
): React.ComponentType<FieldProps> {
  if (schemaType.components?.field) return schemaType.components.field

  if (isBooleanSchemaType(schemaType)) {
    return NoopField
  }

  if (getTypeChain(schemaType, new Set()).some((t) => t.name === 'image' || t.name === 'file')) {
    return ImageOrFileField as React.ComponentType<FieldProps>
  }

  if (schemaType.jsonType !== 'object' && schemaType.jsonType !== 'array') {
    return PrimitiveField
  }

  return ObjectOrArrayField as React.ComponentType<FieldProps>
}

export function defaultResolveItemComponent(
  schemaType: SchemaType
): React.ComponentType<ItemProps> {
  if (schemaType.components?.item) return schemaType.components.item

  return NoopField
}

// TODO: add PreviewProps interface
export function defaultResolvePreviewComponent(
  schemaType: SchemaType
): React.ComponentType<PreviewProps> {
  if (schemaType.components?.preview) return schemaType.components.preview

  return SanityPreview as any // TODO
}
