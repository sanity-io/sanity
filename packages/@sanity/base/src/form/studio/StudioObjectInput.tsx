/* eslint-disable react/jsx-handler-names */
import {SchemaType} from '@sanity/types'
import React, {useCallback} from 'react'
import {Button, Card} from '@sanity/ui'
import {
  ArrayOfObjectsInputProps,
  BooleanInputProps,
  InputProps,
  NumberInputProps,
  ObjectInputProps,
  RenderFieldCallback,
  RenderInputCallback,
  RenderItemCallback,
  StringInputProps,
} from '../types'
import {
  assertType,
  isArrayInputProps,
  isBooleanField,
  isObjectInputProps,
  isPrimitiveField,
} from '../utils/asserters'
import {FormField, FormFieldSet} from '../components/formField'
import {ObjectInput} from '../inputs/ObjectInput'
import {ArrayInput} from '../inputs/arrays/ArrayOfObjectsInput'
import {ObjectItemProps} from '../types/itemProps'

export interface StudioObjectInputProps
  extends Omit<ObjectInputProps, 'renderField' | 'renderInput' | 'renderItem'> {
  resolveInputComponent: (schemaType: SchemaType) => React.ComponentType<InputProps>
}

export function StudioObjectInput(props: StudioObjectInputProps) {
  const {resolveInputComponent} = props
  const renderItem: RenderItemCallback = useCallback((_item) => {
    const item = _item as ObjectItemProps
    return (
      <Card radius={2} padding={2}>
        <Button
          onClick={() => item.onSetCollapsed(!item.collapsed)}
          text={item.collapsed ? 'Expand' : 'Collapse'}
        />
        {item.collapsed ? (
          <Card shadow={1} radius={2}>
            Preview: {JSON.stringify(item.value)}
          </Card>
        ) : (
          item.children
        )}
      </Card>
    )
  }, [])

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
        return <ArrayInput {...inputProps} />
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

  return (
    <ObjectInput
      {...props}
      renderInput={renderInput}
      renderField={renderField}
      renderItem={renderItem}
    />
  )
}
