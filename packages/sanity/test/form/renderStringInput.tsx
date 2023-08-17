import React from 'react'
import {FieldDefinition, StringSchemaType} from '@sanity/types'
import {PrimitiveInputElementProps, StringInputProps} from '../../src/core'
import {renderInput, TestRenderInputContext, TestRenderInputProps} from './renderInput'
import {TestRenderProps} from './types'

const noopRenderDefault = () => <></>

export type TestRenderStringInputCallback = (
  inputProps: StringInputProps,
  context: TestRenderInputContext,
) => React.ReactElement

export async function renderStringInput(options: {
  fieldDefinition: FieldDefinition<'date' | 'datetime' | 'string' | 'url'>
  props?: TestRenderProps
  render: TestRenderStringInputCallback
}) {
  const {fieldDefinition, props, render} = options

  function transformProps(
    inputProps: TestRenderInputProps<PrimitiveInputElementProps>,
  ): StringInputProps {
    const {schemaType, value, elementProps, ...restProps} = inputProps

    return {
      ...restProps,
      elementProps: {
        ...elementProps,
        value: value as string,
      },
      changed: false,
      schemaType: schemaType as StringSchemaType,
      value: value as string,
      renderDefault: noopRenderDefault,
    }
  }

  const result = await renderInput({
    fieldDefinition,
    props,
    render: (inputProps, context) => render(transformProps(inputProps), context),
  })

  function rerender(subsequentRender: TestRenderStringInputCallback) {
    result.rerender((inputProps, context) => subsequentRender(transformProps(inputProps), context))
  }

  return {...result, rerender}
}
