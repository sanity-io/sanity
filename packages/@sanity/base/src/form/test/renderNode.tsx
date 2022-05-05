/* eslint-disable @typescript-eslint/no-explicit-any */

import {ObjectSchemaType, SchemaType} from '@sanity/types'
import {render} from '@testing-library/react'
import {noop} from 'lodash'
import React, {forwardRef} from 'react'
import {StudioProvider, useSource} from '../../studio'
import {createConfig} from '../../config'
import {FIXME, InputProps, FormInputComponentResolver, FormPreviewComponentResolver} from '../types'
import {route, RouterProvider} from '../../router'
import {FormBuilderProvider} from '../FormBuilderProvider'
import {ObjectInput} from '../inputs/ObjectInput'
import {createPatchChannel} from '../patch/PatchChannel'
import {ReviewChangesContextProvider} from '../studio/contexts/reviewChanges/ReviewChangesProvider'
import {is} from '../utils/is'

const GenericInput = forwardRef(function GenericInput(
  props: InputProps,
  ref: React.ForwardedRef<any>
) {
  return (
    <input
      type="string"
      ref={ref}
      // eslint-disable-next-line react/jsx-handler-names
      onFocus={props.onFocus}
    />
  )
})

function GenericPreview() {
  return <div data-testid="preview" />
}

const inputResolver: FormInputComponentResolver = (type: SchemaType) => {
  if (is('object', type)) {
    return ObjectInput as FIXME
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
  // const client = createMockSanityClient() as FIXME

  // dummy config
  const config = createConfig({
    name: 'test',
    title: 'Test',
    projectId: 'foo',
    dataset: 'foo',
    schema: {
      types: [typeDef],
    },
  })

  const filterField = jest.fn().mockImplementation(() => true)

  const patchChannel = createPatchChannel()

  function Tester(props: any) {
    const {schema} = useSource()
    const schemaErrors = schema._validation?.some((m) =>
      m.problems.some((p) => p.severity === 'error')
    )

    if (schemaErrors) {
      // console.log(JSON.stringify(schema._validation, null, 2))
      throw new Error('schema validation errors')
    }

    const type = schema.get(typeDef.name)

    if (!type) {
      throw new Error(`type not found: ${typeDef.name}`)
    }

    return (
      <ReviewChangesContextProvider changesOpen={false}>
        <FormBuilderProvider
          __internal_patchChannel={patchChannel}
          filterField={filterField}
          renderField={() => <>TODO</>}
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
    <StudioProvider config={config}>
      <RouterProvider router={router} state={routerState} onNavigate={noop}>
        <Tester />
      </RouterProvider>
    </StudioProvider>
  )

  function rerender(props: any) {
    result.rerender(
      <StudioProvider config={config}>
        <RouterProvider router={router} state={routerState} onNavigate={noop}>
          <Tester {...props} />
        </RouterProvider>
      </StudioProvider>
    )
  }

  return {rerender, result}
}
