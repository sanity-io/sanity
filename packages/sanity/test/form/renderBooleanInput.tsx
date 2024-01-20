import {type BooleanSchemaType, type FieldDefinition} from '@sanity/types'
import type * as React from 'react'

import {type BooleanInputProps, type PrimitiveInputElementProps} from '../../src/core'
import {renderInput, type TestRenderInputProps} from './renderInput'
import {type TestRenderProps} from './types'

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
