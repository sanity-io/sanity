import React from 'react'
import {BooleanSchemaType, FieldDefinition} from '@sanity/types'
import {BooleanInputProps, PrimitiveInputElementProps} from '../../src/core'
import {renderInput, TestRenderInputProps} from './renderInput'
import {TestRenderProps} from './types'

const noopRenderDefault = () => <></>

export type TestRenderBooleanInputCallback = (inputProps: BooleanInputProps) => React.ReactElement

export async function renderBooleanInput(options: {
  fieldDefinition: FieldDefinition<'boolean'>
  props?: TestRenderProps
  render: TestRenderBooleanInputCallback
}) {
  const {fieldDefinition, props, render: initialRender} = options

  function transformProps(
    inputProps: TestRenderInputProps<PrimitiveInputElementProps>,
  ): BooleanInputProps {
    const {schemaType, value, ...restProps} = inputProps

    return {
      ...restProps,
      changed: false,
      schemaType: schemaType as BooleanSchemaType,
      value: value as boolean,
      renderDefault: noopRenderDefault,
    }
  }

  const result = await renderInput({
    fieldDefinition,
    props,
    render: (inputProps) => initialRender(transformProps(inputProps)),
  })

  function rerender(subsequentRender: TestRenderBooleanInputCallback) {
    return result.rerender((inputProps) => subsequentRender(transformProps(inputProps)))
  }

  return {...result, rerender}
}
