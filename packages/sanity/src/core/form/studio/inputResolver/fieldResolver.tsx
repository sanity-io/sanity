/* eslint-disable react/jsx-handler-names */
import {isBooleanSchemaType, isReferenceSchemaType, SchemaType} from '@sanity/types'
import React from 'react'
import {ArrayFieldProps, FieldProps, ObjectFieldProps} from '../../types'
import {ReferenceField} from '../../inputs/ReferenceInput/ReferenceField'
import {FieldMember} from '../../store'
import {FormField, FormFieldSet} from '../../components'
import {ChangeIndicator} from '../../../changeIndicators'
import {useFieldActions} from '../../field'
import {getTypeChain} from './helpers'

function BooleanField(field: FieldProps) {
  const {onMouseEnter, onMouseLeave} = useFieldActions()

  return (
    <ChangeIndicator
      path={field.path}
      hasFocus={Boolean(field.inputProps.focused)}
      isChanged={field.inputProps.changed}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {field.children}
    </ChangeIndicator>
  )
}

function PrimitiveField(field: FieldProps) {
  const {onMouseEnter, onMouseLeave} = useFieldActions()

  return (
    <FormField
      __unstable_headerActions={field.actions}
      __unstable_presence={field.presence}
      data-testid={`field-${field.inputId}`}
      description={field.description}
      inputId={field.inputId}
      level={field.level}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={field.title}
      validation={field.validation}
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
  const {onMouseEnter, onMouseLeave} = useFieldActions()

  return (
    <FormFieldSet
      __unstable_headerActions={field.actions}
      data-testid={`field-${field.inputId}`}
      level={field.level}
      title={field.title}
      description={field.description}
      collapsed={field.collapsed}
      collapsible={field.collapsible}
      onCollapse={field.onCollapse}
      onExpand={field.onExpand}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      validation={field.validation}
      __unstable_presence={field.presence}
    >
      {field.children}
    </FormFieldSet>
  )
}

function ImageOrFileField(field: ObjectFieldProps) {
  const {onMouseEnter, onMouseLeave} = useFieldActions()

  // unless the hotspot tool dialog is open we want to show whoever is in there as the field presence
  const hotspotField = field.inputProps.members.find(
    (member): member is FieldMember => member.kind === 'field' && member.name === 'hotspot',
  )
  const presence = hotspotField?.open
    ? field.presence
    : field.presence.concat(hotspotField?.field.presence || [])

  return (
    <FormFieldSet
      __unstable_headerActions={field.actions}
      level={field.level}
      title={field.title}
      description={field.description}
      collapsed={field.collapsed}
      collapsible={field.collapsible}
      onCollapse={field.onCollapse}
      onExpand={field.onExpand}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      validation={field.validation}
      __unstable_presence={presence}
    >
      {field.children}
    </FormFieldSet>
  )
}

export function defaultResolveFieldComponent(
  schemaType: SchemaType,
): React.ComponentType<Omit<FieldProps, 'renderDefault'>> {
  if (schemaType.components?.field) return schemaType.components.field

  if (isBooleanSchemaType(schemaType)) {
    return BooleanField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
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
