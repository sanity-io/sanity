/* eslint-disable react/jsx-handler-names */
import {
  isBooleanSchemaType,
  isCrossDatasetReferenceSchemaType,
  isDateTimeSchemaType,
  isReferenceSchemaType,
  type SchemaType,
} from '@sanity/types'
import {type ComponentType, useMemo, useState} from 'react'

import {ChangeIndicator} from '../../../changeIndicators/ChangeIndicator'
import type {DocumentFieldActionNode} from '../../../config/document/fieldActions/types'
import {FormField} from '../../components/formField/FormField'
import {FormFieldSet} from '../../components/formField/FormFieldSet'
import {usePublishedId} from '../../contexts/DocumentIdProvider'
import {FieldActionsProvider} from '../../field/actions/FieldActionsProvider'
import {FieldActionsResolver} from '../../field/actions/FieldActionsResolver'
import {ReferenceField} from '../../inputs/ReferenceInput/ReferenceField'
import type {FieldMember} from '../../store/types/members'
import {type ArrayFieldProps, type FieldProps, type ObjectFieldProps} from '../../types/fieldProps'
import {getTypeChain} from './helpers'

const EMPTY_ARRAY: never[] = []

function BooleanField(field: FieldProps) {
  const documentId = usePublishedId()
  const [fieldActionsNodes, setFieldActionNodes] = useState<DocumentFieldActionNode[]>(EMPTY_ARRAY)
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
      <ChangeIndicator
        hasFocus={Boolean(field.inputProps.focused)}
        isChanged={field.inputProps.changed}
        path={field.path}
      >
        <FieldActionsProvider
          __internal_slot={field.__internal_slot}
          __internal_comments={field.__internal_comments}
          actions={fieldActionsNodes}
          focused={focused}
          path={field.path}
        >
          {field.children}
        </FieldActionsProvider>
      </ChangeIndicator>
    </>
  )
}

function DateTimeField(field: FieldProps) {
  /*
    To account for the time zone picker, all title logic is being moved into the DateTimeInput component.
  */
  const documentId = usePublishedId()
  const [fieldActionsNodes, setFieldActionNodes] = useState<DocumentFieldActionNode[]>(EMPTY_ARRAY)
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
      <FieldActionsProvider
        __internal_slot={field.__internal_slot}
        __internal_comments={field.__internal_comments}
        actions={fieldActionsNodes}
        focused={focused}
        path={field.path}
      >
        {field.children}
      </FieldActionsProvider>
    </>
  )
}

function PrimitiveField(field: FieldProps) {
  const [fieldActionsNodes, setFieldActionNodes] = useState<DocumentFieldActionNode[]>(EMPTY_ARRAY)
  const documentId = usePublishedId()
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

      <FieldActionsProvider
        __internal_slot={field.__internal_slot}
        __internal_comments={field.__internal_comments}
        actions={fieldActionsNodes}
        focused={focused}
        path={field.path}
      >
        <div data-testid={`field-${field.inputId}`}>
          <FormField
            __internal_slot={field.__internal_slot}
            __internal_comments={field.__internal_comments}
            __unstable_headerActions={fieldActionsNodes}
            __unstable_presence={field.presence}
            description={field.description}
            inputId={field.inputId}
            level={field.level}
            title={field.title}
            validation={field.validation}
            deprecated={field.schemaType.deprecated}
          >
            <ChangeIndicator
              hasFocus={focused}
              isChanged={field.inputProps.changed}
              path={field.path}
            >
              {field.children}
            </ChangeIndicator>
          </FormField>
        </div>
      </FieldActionsProvider>
    </>
  )
}

function ObjectOrArrayField(field: ObjectFieldProps | ArrayFieldProps) {
  const [fieldActionsNodes, setFieldActionNodes] = useState<DocumentFieldActionNode[]>(EMPTY_ARRAY)
  const documentId = usePublishedId()
  const focused = Boolean(field.inputProps.focused)

  const disableActions = field.schemaType.options?.disableActions || EMPTY_ARRAY

  const actions = useMemo(() => {
    return field.actions?.filter((a) => {
      if (a.name === 'pasteField') {
        return !disableActions.includes('add')
      }
      if (a.name === 'copyField') {
        return !disableActions.includes('copy')
      }
      return true
    })
  }, [disableActions, field.actions])
  return (
    <>
      {documentId && field.actions && field.actions.length > 0 && (
        <FieldActionsResolver
          actions={actions || EMPTY_ARRAY}
          documentId={documentId}
          documentType={field.schemaType.name}
          onActions={setFieldActionNodes}
          path={field.path}
          schemaType={field.schemaType}
        />
      )}

      <FieldActionsProvider
        __internal_slot={field.__internal_slot}
        __internal_comments={field.__internal_comments}
        actions={fieldActionsNodes}
        focused={focused}
        path={field.path}
      >
        <FormFieldSet
          __internal_comments={field.__internal_comments}
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
          inputId={field.inputId}
          deprecated={field.schemaType.deprecated}
        >
          {field.children}
        </FormFieldSet>
      </FieldActionsProvider>
    </>
  )
}

function ImageOrFileField(field: ObjectFieldProps) {
  const [fieldActionsNodes, setFieldActionNodes] = useState<DocumentFieldActionNode[]>(EMPTY_ARRAY)
  const documentId = usePublishedId()
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
          __internal_comments={field.__internal_comments}
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
          inputId={field.inputId}
          deprecated={field.schemaType.deprecated}
        >
          {field.children}
        </FormFieldSet>
      </FieldActionsProvider>
    </>
  )
}

export function defaultResolveFieldComponent(
  schemaType: SchemaType,
): ComponentType<Omit<FieldProps, 'renderDefault'>> {
  if (schemaType.components?.field) return schemaType.components.field

  if (isBooleanSchemaType(schemaType)) {
    return BooleanField as ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  if (isDateTimeSchemaType(schemaType)) {
    return DateTimeField as ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  const typeChain = getTypeChain(schemaType, new Set())

  if (typeChain.some((t) => t.name === 'image' || t.name === 'file')) {
    return ImageOrFileField as ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  if (typeChain.some((t) => isCrossDatasetReferenceSchemaType(t))) {
    return PrimitiveField as ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  if (typeChain.some((t) => t.name === 'slug')) {
    return PrimitiveField as ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  if (typeChain.some((t) => isReferenceSchemaType(t))) {
    return ReferenceField as ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  if (schemaType.jsonType !== 'object' && schemaType.jsonType !== 'array') {
    return PrimitiveField as ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  return ObjectOrArrayField as ComponentType<Omit<FieldProps, 'renderDefault'>>
}
