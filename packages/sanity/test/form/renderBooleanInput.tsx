import {type BooleanSchemaType, type FieldDefinition} from '@sanity/types'
import {type ReactElement} from 'react'

import {type BooleanInputProps, type PrimitiveInputElementProps} from '../../src/core'
import {renderInput, type RenderInputResult, type TestRenderInputProps} from './renderInput'
import {type TestRenderProps} from './types'

const noopRenderDefault = () => <></>

export type TestRenderBooleanInputCallback = (inputProps: BooleanInputProps) => ReactElement

export async function renderBooleanInput(options: {
  fieldDefinition: FieldDefinition<'boolean'>
  props?: TestRenderProps
  render: TestRenderBooleanInputCallback
}): Promise<RenderInputResult> {
  const {fieldDefinition, props, render} = options

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

  const result = await renderInput<PrimitiveInputElementProps>({
    fieldDefinition,
    props,
    render: (inputProps) => render(transformProps(inputProps)),
  })

  return result
}
