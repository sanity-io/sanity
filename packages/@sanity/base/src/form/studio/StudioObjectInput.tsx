/* eslint-disable react/jsx-handler-names */
import {SchemaType} from '@sanity/types'
import {
  ArrayOfObjectsInputProps,
  BooleanInputProps,
  InputProps,
  NumberInputProps,
  ObjectInputProps,
  RenderFieldCallback,
  RenderInputCallback,
  StringInputProps,
} from '../types'
import React, {useCallback} from 'react'
import {
  assertType,
  isArrayInputProps,
  isBooleanField,
  isObjectInputProps,
  isPrimitiveField,
} from '../utils/asserters'
import {FormField, FormFieldSet} from '../components/formField'
import {ObjectInput} from '../inputs/ObjectInput'
import {StudioArrayInput} from './StudioArrayInput'

export interface StudioObjectInputProps
  extends Omit<ObjectInputProps, 'renderField' | 'renderInput'> {
  resolveInputComponent: (schemaType: SchemaType) => React.ComponentType<InputProps>
}

export function StudioObjectInput(props: StudioObjectInputProps) {
  const {resolveInputComponent} = props

  const renderInput: RenderInputCallback = useCallback(
    (inputProps) => {
      const Input = resolveInputComponent(inputProps.schemaType)
      if (!Input) {
        return <div>No input resolved for type: {inputProps.schemaType.name}</div>
      }
      if (isObjectInputProps(inputProps)) {
        assertType<React.ComponentType<ObjectInputProps>>(Input)
        return <Input {...inputProps} />
      }
      if (isArrayInputProps(inputProps)) {
        assertType<React.ComponentType<ArrayOfObjectsInputProps>>(Input)
        return <StudioArrayInput {...inputProps} />
      }
      assertType<React.ComponentType<StringInputProps | NumberInputProps | BooleanInputProps>>(
        Input
      )
      return <Input {...inputProps} />
    },
    [resolveInputComponent]
  )

  const renderField: RenderFieldCallback = useCallback((field) => {
    if (isBooleanField(field)) {
      return field.children
    }
    if (isPrimitiveField(field)) {
      return (
        <FormField level={field.level} title={field.title} description={field.description}>
          {field.children}
        </FormField>
      )
    }
    return (
      <FormFieldSet
        level={field.level}
        title={field.title}
        description={field.description}
        collapsed={field.collapsed}
        collapsible={field.collapsible}
        onSetCollapsed={field.onSetCollapsed}
      >
        {field.children}
      </FormFieldSet>
    )
  }, [])

  return <ObjectInput {...props} renderInput={renderInput} renderField={renderField} />
}
