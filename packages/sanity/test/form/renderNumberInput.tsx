import React, {ReactElement} from 'react'
import {NumberSchemaType, FieldDefinition} from '@sanity/types'
import {NumberInputProps, PrimitiveInputElementProps} from '../../src/core'
import {renderInput, TestRenderInputContext, TestRenderInputProps} from './renderInput'
import {TestRenderProps} from './types'

const noopRenderDefault = () => <></>

export type TestRenderNumberInputCallback = (
  inputProps: NumberInputProps,
  context: TestRenderInputContext,
) => ReactElement

export async function renderNumberInput(options: {
  fieldDefinition: FieldDefinition<'number'>
  props?: TestRenderProps
  render: TestRenderNumberInputCallback
}) {
  const {fieldDefinition, props, render: initialRender} = options

  function transformProps(
    inputProps: TestRenderInputProps<PrimitiveInputElementProps>,
  ): NumberInputProps {
    const {schemaType, value, ...restProps} = inputProps

    return {
      ...restProps,
      changed: false,
      schemaType: schemaType as NumberSchemaType,
      value: value as number,
      renderDefault: noopRenderDefault,
    }
  }

  const result = await renderInput({
    fieldDefinition,
    props,
    render: (inputProps, context) => initialRender(transformProps(inputProps), context),
  })

  function rerender(subsequentRender: TestRenderNumberInputCallback) {
    result.rerender((inputProps, context) => subsequentRender(transformProps(inputProps), context))
  }

  return {...result, rerender}
}
