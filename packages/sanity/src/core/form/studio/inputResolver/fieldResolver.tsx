/* eslint-disable react/jsx-handler-names */

import {isBooleanSchemaType, isReferenceSchemaType, SchemaType} from '@sanity/types'
import React, {useMemo} from 'react'
import {Box, Button, Card, Flex, Stack} from '@sanity/ui'
import {ArrayFieldProps, FieldProps, ObjectFieldProps} from '../../types'
import {ReferenceField} from '../../inputs/ReferenceInput/ReferenceField'
import {FieldMember} from '../../store'
import {FormField, FormFieldSet} from '../../components'
import {ChangeIndicator} from '../../../changeIndicators'
import {FieldGroupTabs} from '../../inputs/ObjectInput/fieldGroups'
import {getTypeChain} from './helpers'

function PassThrough({children}: {children: React.ReactNode}) {
  return <>{children}</>
}

function DocumentField(field: ObjectFieldProps) {
  const {groups, inputId: id, onFieldGroupSelect, path} = field

  if (groups.length > 0 || field.actions) {
    return (
      <Stack space={5}>
        <Card borderBottom paddingBottom={2} style={{lineHeight: 0}}>
          <Flex align="center">
            <Box flex={1}>
              {groups.length > 0 && (
                <FieldGroupTabs
                  groups={groups}
                  inputId={id}
                  onClick={onFieldGroupSelect}
                  shouldAutoFocus={path.length === 0}
                />
              )}
            </Box>
            {field.actions && <Box flex="none">{field.actions}</Box>}
          </Flex>
        </Card>
        <div>{field.children}</div>
      </Stack>
    )
  }

  return field.children
}

function PrimitiveField(field: FieldProps) {
  return (
    <FormField
      __unstable_headerActions={field.actions}
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
      __unstable_headerActions={field.actions}
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

  const presence = useMemo(
    () =>
      hotspotField?.open
        ? field.presence
        : field.presence.concat(hotspotField?.field.presence || []),
    [field.presence, hotspotField]
  )

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

  if (typeChain.some((t) => t.name === 'document')) {
    return DocumentField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  if (typeChain.some((t) => t.name === 'image' || t.name === 'file')) {
    return ImageOrFileField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  if (typeChain.some((t) => isReferenceSchemaType(t))) {
    return ReferenceField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  if (isDescendentOfType(schemaType, 'slug')) {
    return PrimitiveField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  if (schemaType.jsonType !== 'object' && schemaType.jsonType !== 'array') {
    return PrimitiveField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  return ObjectOrArrayField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
}

function isDescendentOfType(schemaType: SchemaType, typeName: string): boolean {
  if (!schemaType.type) {
    return false
  }

  if (schemaType.type.name === typeName) {
    return true
  }

  return isDescendentOfType(schemaType.type, typeName)
}
