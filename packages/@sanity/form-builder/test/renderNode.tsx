/* eslint-disable @typescript-eslint/no-explicit-any */

import {createConfig, useSource} from '@sanity/base'
import {
  FormInputComponentResolver,
  FormInputProps,
  FormPreviewComponentResolver,
} from '@sanity/base/form'
import {RouterProvider, route} from '@sanity/base/router'
import {StudioProvider} from '@sanity/base/studio'
import {SchemaType} from '@sanity/types'
import {render} from '@testing-library/react'
import {noop} from 'lodash'
import React, {forwardRef} from 'react'
import {FormBuilderProvider} from '../src/FormBuilderProvider'
import {ObjectInput} from '../src/inputs/ObjectInput'
import {createPatchChannel} from '../src/patchChannel'
import {ReviewChangesContextProvider} from '../src/sanity/contexts/reviewChanges/ReviewChangesProvider'
import {is} from '../src/utils/is'
import {createMockSanityClient} from './mocks/sanityClient'

const GenericInput = forwardRef(function GenericInput(
  props: FormInputProps,
  ref: React.ForwardedRef<any>
) {
  return <input type="string" ref={ref} onFocus={props.onFocus} />
})

function GenericPreview() {
  return <div data-testid="preview" />
}

const inputResolver: FormInputComponentResolver = (type: SchemaType) => {
  if (is('object', type)) {
    return ObjectInput
  }
  return GenericInput
}

const previewResolver: FormPreviewComponentResolver = () => GenericPreview

export function renderNode(options: {
  render: (props: {type: SchemaType}) => React.ReactNode
  type: any
}) {
  const {render: renderFn, type: typeDef} = options

  // mock client
  const client = createMockSanityClient() as any

  // dummy config
  const config = createConfig({
    sources: [
      {
        clientFactory: () => client,
        name: 'test',
        title: 'Test',
        projectId: 'foo',
        dataset: 'foo',
        schemaTypes: [typeDef],
      },
    ],
  })

  const filterField = jest.fn().mockImplementation(() => true)
  const setScheme = jest.fn()

  const patchChannel = createPatchChannel()

  function Tester(props: any) {
    const {schema} = useSource()
    const schemaErrors = schema._validation.some((m) =>
      m.problems.some((p) => p.severity === 'error')
    )

    if (schemaErrors) {
      // console.log(JSON.stringify(schema._validation, null, 2))
      throw new Error('schema validation errors')
    }

    const type = schema.get(typeDef.name) as any

    if (!type) {
      throw new Error(`type not found: ${typeDef.name}`)
    }

    return (
      <ReviewChangesContextProvider changesOpen={false}>
        <FormBuilderProvider
          __internal_patchChannel={patchChannel}
          filterField={filterField}
          resolveInputComponent={inputResolver}
          resolvePreviewComponent={previewResolver}
          schema={schema}
          value={undefined}
        >
          {renderFn({type, ...props})}
        </FormBuilderProvider>
      </ReviewChangesContextProvider>
    )
  }

  const router = route.intents('/intents')
  const routerState = {}

  const result = render(
    <StudioProvider config={config} scheme="dark" setScheme={setScheme}>
      <RouterProvider router={router} state={routerState} onNavigate={noop}>
        <Tester />
      </RouterProvider>
    </StudioProvider>
  )

  function rerender(props: any) {
    result.rerender(
      <StudioProvider config={config} scheme="dark" setScheme={setScheme}>
        <RouterProvider router={router} state={routerState} onNavigate={noop}>
          <Tester {...props} />
        </RouterProvider>
      </StudioProvider>
    )
  }

  return {rerender, result, setScheme}
}
