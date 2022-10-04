import {BooleanSchemaType, FieldDefinition} from '@sanity/types'
import {BooleanInputProps, PrimitiveInputElementProps} from '../../src/form'
import {renderInput, TestRenderInputProps} from './renderInput'
import {TestRenderProps} from './types'

export type TestRenderBooleanInputCallback = (inputProps: BooleanInputProps) => React.ReactElement

export async function renderBooleanInput(options: {
  fieldDefinition: FieldDefinition<'boolean'>
  props?: TestRenderProps
  render: TestRenderBooleanInputCallback
}) {
  const {fieldDefinition, props, render: initialRender} = options

  function tranformProps(
    inputProps: TestRenderInputProps<PrimitiveInputElementProps>
  ): BooleanInputProps {
    const {schemaType, value, ...restProps} = inputProps

    return {
      ...restProps,
      changed: false,
      schemaType: schemaType as BooleanSchemaType,
      value: value as boolean,
    }
  }

  const result = await renderInput({
    fieldDefinition,
    props,
    render: (inputProps) => initialRender(tranformProps(inputProps)),
  })

  function rerender(subsequentRender: TestRenderBooleanInputCallback) {
    return result.rerender((inputProps) => subsequentRender(tranformProps(inputProps)))
  }

  return {...result, rerender}
}
