import {type BooleanSchemaType, type FieldDefinition} from '@sanity/types'

import {
  type BooleanInputProps,
  type PrimitiveInputElementProps,
} from '../../src/core/form/types/inputProps'
import {renderInput, type RenderInputResult, type TestRenderInputProps} from './renderInput'
import {type TestRenderProps} from './types'

const noopRenderDefault = () => <></>

export type TestRenderBooleanInputCallback = (inputProps: BooleanInputProps) => React.JSX.Element

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
