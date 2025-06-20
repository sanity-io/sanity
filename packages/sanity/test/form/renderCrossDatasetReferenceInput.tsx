import {
  type CrossDatasetReferenceSchemaType,
  type FieldDefinition,
  type SchemaTypeDefinition,
} from '@sanity/types'
import {of} from 'rxjs'

import type {ObjectInputProps} from '../../src/core/form/types/inputProps'
import type {CrossDatasetReferenceInputProps} from '../../src/core/form/inputs/CrossDatasetReferenceInput/CrossDatasetReferenceInput'
import {type TestRenderInputContext} from './renderInput'
import {renderObjectInput} from './renderObjectInput'
import {type TestRenderProps} from './types'

const EMPTY_SEARCH = () => of([])

export type TestRenderCrossDatasetReferenceInputCallback = (
  inputProps: CrossDatasetReferenceInputProps,
  context: TestRenderInputContext,
) => React.JSX.Element

export async function renderCrossDatasetReferenceInput(options: {
  fieldDefinition: SchemaTypeDefinition<'reference'>
  getReferenceInfo: CrossDatasetReferenceInputProps['getReferenceInfo']
  onSearch?: CrossDatasetReferenceInputProps['onSearch']
  props?: TestRenderProps
  render: TestRenderCrossDatasetReferenceInputCallback
}) {
  const {
    fieldDefinition,
    getReferenceInfo,
    onSearch = EMPTY_SEARCH,
    props,
    render: initialRender,
  } = options

  function transformProps(baseProps: ObjectInputProps, _context: TestRenderInputContext) {
    const {changed, schemaType, value, ...restProps} = baseProps

    return {
      ...restProps,
      changed,
      getReferenceInfo,
      onSearch,
      schemaType: schemaType as CrossDatasetReferenceSchemaType,
      value: value as CrossDatasetReferenceInputProps['value'],
    }
  }

  const result = await renderObjectInput({
    fieldDefinition: fieldDefinition as FieldDefinition<'object'>,
    props,
    render: (baseProps, context) => initialRender(transformProps(baseProps, context), context),
  })

  return result
}
