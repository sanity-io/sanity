import {type FieldDefinition, type StringSchemaType} from '@sanity/types'
import {type ReactElement} from 'react'

import {type PrimitiveInputElementProps, type StringInputProps} from '../../src/core'
import {renderInput, type TestRenderInputContext, type TestRenderInputProps} from './renderInput'
import {type TestRenderProps} from './types'

const noopRenderDefault = () => <></>

export type TestRenderStringInputCallback = (
  inputProps: StringInputProps,
  context: TestRenderInputContext,
) => ReactElement

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

  const result = await renderInput<PrimitiveInputElementProps>({
    fieldDefinition,
    props,
    render: (inputProps, context) => render(transformProps(inputProps), context),
  })

  return result
}
