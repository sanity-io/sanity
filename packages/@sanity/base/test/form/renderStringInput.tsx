import {Schema, StringSchemaType} from '@sanity/types'
import {StringInputProps} from '../../src/form'
import {renderInput, TestRenderInputContext, TestRenderInputProps} from './renderInput'
import {TestRenderProps} from './types'

export type TestRenderStringInputCallback = (
  inputProps: StringInputProps,
  context: TestRenderInputContext
) => React.ReactElement

export function renderStringInput(options: {
  fieldDefinition: Schema.TypeDefinition<'date' | 'datetime' | 'string' | 'url'>
  props?: TestRenderProps
  render: TestRenderStringInputCallback
}) {
  const {fieldDefinition, props, render} = options

  function transformProps(inputProps: TestRenderInputProps): StringInputProps {
    const {compareValue, schemaType, value, ...restProps} = inputProps

    return {
      ...restProps,
      compareValue: compareValue as string,
      schemaType: schemaType as StringSchemaType,
      value: value as string,
    }
  }

  const result = renderInput({
    fieldDefinition,
    props,
    render: (inputProps, context) => render(transformProps(inputProps), context),
  })

  function rerender(subsequentRender: TestRenderStringInputCallback) {
    result.rerender((inputProps, context) => subsequentRender(transformProps(inputProps), context))
  }

  return {...result, rerender}
}
