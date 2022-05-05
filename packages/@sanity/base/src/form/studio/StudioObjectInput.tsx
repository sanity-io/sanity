/* eslint-disable react/jsx-handler-names */
import {SchemaType} from '@sanity/types'
import React, {useCallback} from 'react'
import {
  InputProps,
  ObjectInputProps,
  RenderArrayItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
} from '../types'
import {isBooleanField, isPrimitiveField} from '../utils/asserters'
import {FormField, FormFieldSet} from '../components/formField'
import {ObjectInput} from '../inputs/ObjectInput'
import {ObjectItemProps} from '../types/itemProps'

export interface StudioObjectInputProps
  extends Omit<ObjectInputProps, 'renderField' | 'renderInput' | 'renderItem'> {
  resolveInputComponent: (schemaType: SchemaType) => React.ComponentType<InputProps>
}

export function StudioObjectInput(props: StudioObjectInputProps) {
  const {resolveInputComponent} = props
  const renderItem: RenderArrayItemCallback = useCallback((_item) => {
    const item = _item as ObjectItemProps
    return <>{item.children}</>
  }, [])

  const renderInput: RenderInputCallback = useCallback(
    (inputProps) => {
      const Input = resolveInputComponent(inputProps.schemaType)
      if (!Input) {
        return <div>No input resolved for type: {inputProps.schemaType.name}</div>
      }
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

  return (
    <ObjectInput
      {...props}
      renderInput={renderInput}
      renderField={renderField}
      renderItem={renderItem}
    />
  )
}
