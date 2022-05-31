import {Schema, BooleanSchemaType} from '@sanity/types'
import {BooleanInputProps} from '../../src/form'
import {renderInput, TestRenderInputProps} from './renderInput'
import {TestRenderProps} from './types'

export type TestRenderBooleanInputCallback = (inputProps: BooleanInputProps) => React.ReactElement

export function renderBooleanInput(options: {
  fieldDefinition: Schema.TypeDefinition<'boolean'>
  props?: TestRenderProps
  render: TestRenderBooleanInputCallback
}) {
  const {fieldDefinition, props, render: initialRender} = options

  function tranformProps(inputProps: TestRenderInputProps): BooleanInputProps {
    const {compareValue, schemaType, value, ...restProps} = inputProps

    return {
      ...restProps,
      compareValue: compareValue as boolean,
      schemaType: schemaType as BooleanSchemaType,
      value: value as boolean,
    }
  }

  const result = renderInput({
    fieldDefinition,
    props,
    render: (inputProps) => initialRender(tranformProps(inputProps)),
  })

  function rerender(subsequentRender: TestRenderBooleanInputCallback) {
    return result.rerender((inputProps) => subsequentRender(tranformProps(inputProps)))
  }

  return {...result, rerender}
}
