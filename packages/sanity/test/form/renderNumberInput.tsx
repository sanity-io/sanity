import {Schema, NumberSchemaType} from '@sanity/types'
import {NumberInputProps, PrimitiveInputElementProps} from '../../src/form'
import {renderInput, TestRenderInputContext, TestRenderInputProps} from './renderInput'
import {TestRenderProps} from './types'

export type TestRenderNumberInputCallback = (
  inputProps: NumberInputProps,
  context: TestRenderInputContext
) => React.ReactElement

export async function renderNumberInput(options: {
  fieldDefinition: Schema.FieldDefinition<'number'>
  props?: TestRenderProps
  render: TestRenderNumberInputCallback
}) {
  const {fieldDefinition, props, render: initialRender} = options

  function transformProps(
    inputProps: TestRenderInputProps<PrimitiveInputElementProps>
  ): NumberInputProps {
    const {schemaType, value, ...restProps} = inputProps

    return {
      ...restProps,
      changed: false,
      schemaType: schemaType as NumberSchemaType,
      value: value as number,
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
