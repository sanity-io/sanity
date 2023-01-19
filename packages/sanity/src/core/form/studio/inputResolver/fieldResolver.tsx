/* eslint-disable react/jsx-handler-names */
import {isBooleanSchemaType, isReferenceSchemaType, SchemaType} from '@sanity/types'
import React from 'react'
import {ArrayFieldProps, FieldProps, ObjectFieldProps} from '../../types'
import {ReferenceField} from '../../inputs/ReferenceInput/ReferenceField'
import {FieldMember} from '../../store'
import {FormField, FormFieldSet} from '../../components'
import {ChangeIndicator} from '../../../changeIndicators'
import {getTypeChain} from './helpers'

function PassThrough({children}: {children: React.ReactNode}) {
  return <>{children}</>
}

function PrimitiveField(field: FieldProps) {
  return (
    <FormField
      data-testid={`field-${field.inputId}`}
      inputId={field.inputId}
      level={field.level}
      title={field.title}
      description={field.description}
      validation={field.validation}
      __unstable_presence={field.presence}
    >
      <ChangeIndicator
        path={field.path}
        hasFocus={Boolean(field.inputProps.focused)}
        isChanged={field.inputProps.changed}
      >
        {field.children}
      </ChangeIndicator>
    </FormField>
  )
}

function ObjectOrArrayField(field: ObjectFieldProps | ArrayFieldProps) {
  return (
    <FormFieldSet
      data-testid={`field-${field.inputId}`}
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

function ImageOrFileField(field: ObjectFieldProps) {
  // unless the hotspot tool dialog is open we want to show whoever is in there as the field presence
  const hotspotField = field.inputProps.members.find(
    (member): member is FieldMember => member.kind === 'field' && member.name === 'hotspot'
  )
  const presence = hotspotField?.open
    ? field.presence
    : field.presence.concat(hotspotField?.field.presence || [])

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
      __unstable_presence={presence}
    >
      {field.children}
    </FormFieldSet>
  )
}

export function defaultResolveFieldComponent(
  schemaType: SchemaType
): React.ComponentType<Omit<FieldProps, 'renderDefault'>> {
  if (schemaType.components?.field) return schemaType.components.field

  if (isBooleanSchemaType(schemaType)) {
    return PassThrough
  }

  const typeChain = getTypeChain(schemaType, new Set())

  if (typeChain.some((t) => t.name === 'image' || t.name === 'file')) {
    return ImageOrFileField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
  }
  if (typeChain.some((t) => isReferenceSchemaType(t))) {
    return ReferenceField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  if (schemaType.jsonType !== 'object' && schemaType.jsonType !== 'array') {
    return PrimitiveField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  return ObjectOrArrayField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
}
