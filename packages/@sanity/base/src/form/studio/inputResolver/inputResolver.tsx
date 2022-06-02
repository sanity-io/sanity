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
import {
  FIXME,
  FieldProps,
  InputProps,
  ItemProps,
  ObjectFieldProps,
  ArrayFieldProps,
} from '../../types'
import * as is from '../../utils/is'
import {FormField, FormFieldSet} from '../../components/formField'
import {SanityPreview} from '../../../preview'
import {resolveReferenceInput} from './resolveReferenceInput'
import {resolveArrayInput} from './resolveArrayInput'
import {resolveStringInput} from './resolveStringInput'
import {resolveNumberInput} from './resolveNumberInput'
import {defaultInputs} from './defaultInputs'

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
  return [...next, type]
}

export function defaultResolveInputComponent(
  schemaType: SchemaType
): React.ComponentType<InputProps> {
  if (schemaType.components?.input) return schemaType.components.input

  const componentFromTypeVariants = resolveComponentFromTypeVariants(schemaType)
  if (componentFromTypeVariants) return componentFromTypeVariants

  const subType =
    // using an object + Object.values to de-dupe the type chain by type name
    Object.values(
      getTypeChain(schemaType, new Set()).reduce<Record<string, SchemaType>>((acc, type) => {
        acc[type.name] = type
        return acc
      }, {})
    ).find((t) => defaultInputs[t.name])

  if (subType) return defaultInputs[subType.name]

  throw new Error(`Could not find input component for schema type \`${schemaType.name}\``)
}

function NoopField({children}: {children: React.ReactNode}) {
  return <>{children}</>
}

function PrimitiveField(field: FieldProps) {
  return (
    <FormField
      level={field.level}
      title={field.title}
      description={field.description}
      __unstable_presence={field.presence}
      validation={field.validation}
    >
      {field.children}
    </FormField>
  )
}

function ObjectOrArrayField(field: ObjectFieldProps | ArrayFieldProps) {
  return (
    <FormFieldSet
      level={field.level}
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

export function defaultResolveFieldComponent(
  schemaType: SchemaType
): React.ComponentType<FieldProps> {
  if (schemaType.components?.field) return schemaType.components.field

  if (isBooleanSchemaType(schemaType)) {
    return NoopField
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
export function defaultResolvePreviewComponent(schemaType: SchemaType): React.ComponentType<any> {
  if (schemaType.components?.preview) return schemaType.components.preview

  return SanityPreview
}
