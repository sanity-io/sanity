/* eslint-disable @typescript-eslint/no-explicit-any */

import {createConfig, useSource} from '@sanity/base'
import {FormBuilderFilterFieldFn} from '@sanity/base/form'
import {StudioProvider} from '@sanity/base/studio'
import {Path} from '@sanity/types'
import {render} from '@testing-library/react'
import React from 'react'
import {SanityFormBuilder} from '../src'
import {createPatchChannel} from '../src/patchChannel'
import {FIXME} from '../src/types'
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
  const setScheme = jest.fn()

  const client = createMockSanityClient() as FIXME

  const schemaTypes = [typeDef]

  const config = createConfig({
    sources: [
      {
        clientFactory: () => client,
        name: 'test',
        title: 'Test',
        projectId: 'foo',
        dataset: 'foo',
        schemaTypes,
      },
    ],
  })

  function Tester(testerProps: {focusPath: Path}) {
    const {schema} = useSource()
    const docType = schema.get(typeDef.name)

    return (
      <SanityFormBuilder
        {...testerProps}
        __internal_patchChannel={patchChannel}
        changesOpen={false}
        filterField={filterField}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        presence={[]}
        schema={schema}
        type={docType!}
        validation={[]}
        value={value}
        {...restProps}
      />
    )
  }

  const result = render(
    <StudioProvider config={config} scheme="dark" setScheme={setScheme}>
      <Tester focusPath={focusPath} />
    </StudioProvider>
  )

  function rerender(nextProps: {focusPath?: Path}) {
    result.rerender(
      <StudioProvider config={config} scheme="dark" setScheme={setScheme}>
        <Tester focusPath={focusPath} {...nextProps} />
      </StudioProvider>
    )
  }

  return {onChange, onFocus, rerender, result}
}
