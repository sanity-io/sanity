/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react'
import {Path} from '@sanity/types'
import {render} from '@testing-library/react'
import {createConfig} from '../../config'
import {FormBuilderFilterFieldFn, FIXME} from '../types'
import {StudioProvider, useSource} from '../../studio'
import {createPatchChannel} from '../patchChannel'
import {SanityFormBuilder} from '../sanity/SanityFormBuilder'
import {createMockSanityClient} from './mocks/sanityClient'

export function renderForm(props: {
  filterField?: FormBuilderFilterFieldFn
  focusPath?: Path
  type: any // SchemaTypeDefinition
  value?: any
}) {
  const {
    filterField = jest.fn().mockImplementation(() => true),
    focusPath = [],
    type: typeDef,
    value,
    ...restProps
  } = props

  const patchChannel = createPatchChannel()

  const onBlur = jest.fn()
  const onChange = jest.fn()
  const onFocus = jest.fn()

  const client = createMockSanityClient() as FIXME

  const schemaTypes = [typeDef]

  const config = createConfig({
    name: 'test',
    title: 'Test',
    projectId: 'foo',
    dataset: 'foo',
    schema: {types: schemaTypes},
  })

  function Tester(testerProps: {focusPath: Path}) {
    const {schema} = useSource()
    const docType = schema.get(typeDef.name)

    return (
      <SanityFormBuilder
        {...testerProps}
        __internal_patchChannel={patchChannel}
        changesOpen={false}
        // filterField={filterField}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        presence={[]}
        schema={schema}
        type={docType!}
        validation={[]}
        value={value}
        {...(restProps as FIXME)}
      />
    )
  }

  const result = render(
    <StudioProvider config={config}>
      <Tester focusPath={focusPath} />
    </StudioProvider>
  )

  function rerender(nextProps: {focusPath?: Path}) {
    result.rerender(
      <StudioProvider config={config}>
        <Tester focusPath={focusPath} {...nextProps} />
      </StudioProvider>
    )
  }

  return {onChange, onFocus, rerender, result}
}
