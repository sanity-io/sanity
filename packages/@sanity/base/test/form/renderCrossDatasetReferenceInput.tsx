import {CrossDatasetReferenceSchemaType, Schema} from '@sanity/types'
import React from 'react'
import {of} from 'rxjs'
import {CrossDatasetReferenceInputProps} from '../../src/form/inputs/CrossDatasetReferenceInput'
import {ObjectInputProps} from '../../src/form'
import {TestRenderInputContext} from './renderInput'
import {TestRenderProps} from './types'
import {renderObjectInput} from './renderObjectInput'

const EMPTY_SEARCH = () => of([])

export type TestRenderCrossDatasetReferenceInputCallback = (
  inputProps: CrossDatasetReferenceInputProps,
  context: TestRenderInputContext
) => React.ReactElement

export function renderCrossDatasetReferenceInput(options: {
  fieldDefinition: Schema.TypeDefinition<'reference'>
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

  function transformProps(baseProps: ObjectInputProps) {
    const {compareValue, schemaType, value, ...restProps} = baseProps

    return {
      ...restProps,
      compareValue: compareValue as CrossDatasetReferenceInputProps['compareValue'],
      getReferenceInfo,
      onSearch,
      schemaType: schemaType as CrossDatasetReferenceSchemaType,
      value: value as CrossDatasetReferenceInputProps['value'],
    }
  }

  const result = renderObjectInput({
    fieldDefinition: fieldDefinition as Schema.TypeDefinition<'object'>,
    props,
    render: (baseProps, context) => initialRender(transformProps(baseProps), context),
  })

  function rerender(subsequentRender: TestRenderCrossDatasetReferenceInputCallback) {
    result.rerender((baseProps, context) => subsequentRender(transformProps(baseProps), context))
  }

  return {...result, rerender}
}
