import {
  type FieldDefinition,
  type GlobalDocumentReferenceSchemaType,
  type SchemaTypeDefinition,
} from '@sanity/types'
import {type ReactElement} from 'react'
import {of} from 'rxjs'

import type {ObjectInputProps} from '../../src/core/form/types/inputProps'
import type {GlobalDocumentReferenceInputProps} from '../../src/core/form/inputs/GlobalDocumentReferenceInput/GlobalDocumentReferenceInput'
import {type TestRenderInputContext} from './renderInput'
import {renderObjectInput} from './renderObjectInput'
import {type TestRenderProps} from './types'

const EMPTY_SEARCH = () => of([])

export type TestRenderGlobalDocumentReferenceInputCallback = (
  inputProps: GlobalDocumentReferenceInputProps,
  context: TestRenderInputContext,
) => ReactElement

export async function renderGlobalDocumentReferenceInput(options: {
  fieldDefinition: SchemaTypeDefinition<'globalDocumentReference'>
  getReferenceInfo: GlobalDocumentReferenceInputProps['getReferenceInfo']
  onSearch?: GlobalDocumentReferenceInputProps['onSearch']
  props?: TestRenderProps
  render: TestRenderGlobalDocumentReferenceInputCallback
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
      schemaType: schemaType as GlobalDocumentReferenceSchemaType,
      value: value as GlobalDocumentReferenceInputProps['value'],
    }
  }

  const result = await renderObjectInput({
    fieldDefinition: fieldDefinition as FieldDefinition<'object'>,
    props,
    render: (baseProps, context) => initialRender(transformProps(baseProps, context), context),
  })

  return result
}
