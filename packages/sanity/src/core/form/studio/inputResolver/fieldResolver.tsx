/* eslint-disable react/jsx-handler-names */
import {
  isBooleanSchemaType,
  isCrossDatasetReferenceSchemaType,
  isReferenceSchemaType,
  SchemaType,
} from '@sanity/types'
import React, {useState} from 'react'
import {ArrayFieldProps, FieldProps, ObjectFieldProps} from '../../types'
import {ReferenceField} from '../../inputs/ReferenceInput/ReferenceField'
import {FieldMember} from '../../store'
import {FormField, FormFieldSet} from '../../components'
import {ChangeIndicator} from '../../../changeIndicators'
import {FieldActionsProvider, FieldActionsResolver} from '../../field'
import {useFormPublishedId} from '../../useFormPublishedId'
import {DocumentFieldActionNode} from '../../../config'
import {getTypeChain} from './helpers'

const EMPTY_ARRAY: never[] = []

function BooleanField(field: FieldProps) {
  return (
    <ChangeIndicator
      hasFocus={Boolean(field.inputProps.focused)}
      isChanged={field.inputProps.changed}
      path={field.path}
    >
      {field.children}
    </ChangeIndicator>
  )
}

function PrimitiveField(field: FieldProps) {
  const [fieldActionsNodes, setFieldActionNodes] = useState<DocumentFieldActionNode[]>(EMPTY_ARRAY)
  const documentId = useFormPublishedId()
  const focused = Boolean(field.inputProps.focused)

  return (
    <>
      {documentId && field.actions && field.actions.length > 0 && (
        <FieldActionsResolver
          actions={field.actions}
          documentId={documentId}
          documentType={field.schemaType.name}
          onActions={setFieldActionNodes}
          path={field.path}
          schemaType={field.schemaType}
        />
      )}

      <FieldActionsProvider actions={fieldActionsNodes} focused={focused} path={field.path}>
        <FormField
          __internal_slot={field.__internal_slot}
          __unstable_headerActions={fieldActionsNodes}
          __unstable_presence={field.presence}
          data-testid={`field-${field.inputId}`}
          description={field.description}
          inputId={field.inputId}
          level={field.level}
          title={field.title}
          validation={field.validation}
        >
          <ChangeIndicator
            hasFocus={focused}
            isChanged={field.inputProps.changed}
            path={field.path}
          >
            {field.children}
          </ChangeIndicator>
        </FormField>
      </FieldActionsProvider>
    </>
  )
}

function ObjectOrArrayField(field: ObjectFieldProps | ArrayFieldProps) {
  const [fieldActionsNodes, setFieldActionNodes] = useState<DocumentFieldActionNode[]>(EMPTY_ARRAY)
  const documentId = useFormPublishedId()
  const focused = Boolean(field.inputProps.focused)

  return (
    <>
      {documentId && field.actions && field.actions.length > 0 && (
        <FieldActionsResolver
          actions={field.actions}
          documentId={documentId}
          documentType={field.schemaType.name}
          onActions={setFieldActionNodes}
          path={field.path}
          schemaType={field.schemaType}
        />
      )}

      <FieldActionsProvider actions={fieldActionsNodes} focused={focused} path={field.path}>
        <FormFieldSet
          __internal_slot={field.__internal_slot}
          __unstable_headerActions={fieldActionsNodes}
          __unstable_presence={field.presence}
          collapsed={field.collapsed}
          collapsible={field.collapsible}
          data-testid={`field-${field.inputId}`}
          description={field.description}
          level={field.level}
          onCollapse={field.onCollapse}
          onExpand={field.onExpand}
          title={field.title}
          validation={field.validation}
        >
          {field.children}
        </FormFieldSet>
      </FieldActionsProvider>
    </>
  )
}

function ImageOrFileField(field: ObjectFieldProps) {
  const [fieldActionsNodes, setFieldActionNodes] = useState<DocumentFieldActionNode[]>(EMPTY_ARRAY)
  const documentId = useFormPublishedId()
  const focused = Boolean(field.inputProps.focused)

  // unless the hotspot tool dialog is open we want to show whoever is in there as the field presence
  const hotspotField = field.inputProps.members.find(
    (member): member is FieldMember => member.kind === 'field' && member.name === 'hotspot',
  )
  const presence = hotspotField?.open
    ? field.presence
    : field.presence.concat(hotspotField?.field.presence || EMPTY_ARRAY)

  return (
    <>
      {documentId && field.actions && field.actions.length > 0 && (
        <FieldActionsResolver
          actions={field.actions}
          documentId={documentId}
          documentType={field.schemaType.name}
          onActions={setFieldActionNodes}
          path={field.path}
          schemaType={field.schemaType}
        />
      )}

      <FieldActionsProvider actions={fieldActionsNodes} focused={focused} path={field.path}>
        <FormFieldSet
          __internal_slot={field.__internal_slot}
          __unstable_headerActions={fieldActionsNodes}
          __unstable_presence={presence}
          collapsed={field.collapsed}
          collapsible={field.collapsible}
          description={field.description}
          level={field.level}
          onCollapse={field.onCollapse}
          onExpand={field.onExpand}
          title={field.title}
          validation={field.validation}
        >
          {field.children}
        </FormFieldSet>
      </FieldActionsProvider>
    </>
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

  if (typeChain.some((t) => isCrossDatasetReferenceSchemaType(t))) {
    return PrimitiveField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  if (typeChain.some((t) => t.name === 'slug')) {
    return PrimitiveField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  if (typeChain.some((t) => isReferenceSchemaType(t))) {
    return ReferenceField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  if (schemaType.jsonType !== 'object' && schemaType.jsonType !== 'array') {
    return PrimitiveField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  return ObjectOrArrayField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
}
