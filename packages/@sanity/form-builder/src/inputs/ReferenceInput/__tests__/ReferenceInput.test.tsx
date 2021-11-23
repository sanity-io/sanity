// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {render} from '@testing-library/react'
import {RouterProvider} from '@sanity/state-router/components'
import {route} from '@sanity/state-router'
import React, {forwardRef, useImperativeHandle} from 'react'
import Schema from '@sanity/schema'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {of} from 'rxjs'
import {noop} from 'lodash'

import {AvailabilityReason} from '@sanity/base/_internal'
import {Reference} from '@sanity/types'
import {Props, ReferenceInput} from '../ReferenceInput'
import {DocumentPreview, ReferenceInfo} from '../types'
import {PartialExcept} from '../../../utils/util-types'

const EMPTY_SEARCH = () => of([])

const AVAILABLE = {
  available: true,
  reason: AvailabilityReason.READABLE,
} as const
const UNAVAILABLE_NOT_FOUND = {
  available: false,
  reason: AvailabilityReason.NOT_FOUND,
} as const
const UNAVAILABLE_PERMISSION_DENIED = {
  available: false,
  reason: AvailabilityReason.PERMISSION_DENIED,
} as const

const infinityNoop = new Proxy(() => infinityNoop, {get: () => infinityNoop})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StubComponent = forwardRef((_: any, ref) => {
  useImperativeHandle(ref, () => infinityNoop, [])
  return null
})
StubComponent.displayName = 'StubComponent'

function ReferenceInputTester(props: PartialExcept<Props, 'type' | 'getReferenceInfo'>) {
  const onFocus = jest.fn()
  const onChange = jest.fn()

  return (
    <RouterProvider router={route.intents('/intents')} state={{}} onNavigate={noop}>
      <ThemeProvider scheme="light" theme={studioTheme}>
        <ToastProvider>
          <LayerProvider>
            <ReferenceInput
              onFocus={onFocus}
              onChange={onChange}
              markers={[]}
              level={0}
              focusPath={[]}
              presence={[]}
              onSearch={EMPTY_SEARCH}
              createOptions={[]}
              editReferenceLinkComponent={StubComponent}
              onEditReference={noop}
              {...props}
            />
          </LayerProvider>
        </ToastProvider>
      </ThemeProvider>
    </RouterProvider>
  )
}

function ReferenceInfoTester(
  props: Partial<Omit<Props, 'getReferenceInfo' | 'type'>> & {
    referenceInfo: ReferenceInfo
    typeIsWeakRef?: boolean
    isEditing?: boolean
    value: Reference
  }
) {
  const schema = Schema.compile({
    types: [
      {name: 'actor', type: 'document', fields: [{name: 'name', type: 'string'}]},
      {name: 'actorReference', type: 'reference', weak: props.typeIsWeakRef, to: [{type: 'actor'}]},
    ],
  })

  return (
    <ReferenceInputTester
      getReferenceInfo={(id: string) => of(props.referenceInfo)}
      onSearch={EMPTY_SEARCH}
      focusPath={props.isEditing ? ['_ref'] : []}
      type={schema.get('actorReference')}
      value={props.value}
    />
  )
}

const PUBLISHED_PREVIEW = {title: 'Actor (published)', description: ''}
const DRAFT_PREVIEW = {title: 'Actor (draft)', description: ''}

describe('if schema type is a strong reference', () => {
  test('the UI does *NOT* show a warning if the draft exist and the reference value is weak and has a _strengthenOnPublish flag', () => {
    const {getByTestId, queryByTestId} = render(
      <ReferenceInfoTester
        value={{
          _type: 'reference',
          _ref: 'someActor',
          _weak: true,
          _strengthenOnPublish: {type: 'actor'},
        }}
        referenceInfo={{
          id: 'someActor',
          type: 'actorReference',
          availability: AVAILABLE,
          preview: {
            published: undefined,
            draft: DRAFT_PREVIEW as DocumentPreview,
          },
        }}
      />
    )
    expect(queryByTestId('alert-nonexistent-document')).toBe(null)
  })

  test('the UI shows a warning if the document is published and the value is is weak', () => {
    const {getByTestId, queryByTestId} = render(
      <ReferenceInfoTester
        value={{_type: 'reference', _weak: true, _ref: 'someActor'}}
        referenceInfo={{
          id: 'someActor',
          type: 'actorReference',
          availability: AVAILABLE,
          preview: {
            published: undefined,
            draft: DRAFT_PREVIEW as DocumentPreview,
          },
        }}
      />
    )
    expect(queryByTestId('alert-reference-strength-mismatch')).toBeInTheDocument()
  })
})

describe('if schema type is a weak reference', () => {
  test('the UI indicates that the referenced document does not exist', () => {
    const {getByTestId} = render(
      <ReferenceInfoTester
        typeIsWeakRef
        value={{_type: 'reference', _weak: true, _ref: 'someActor'}}
        referenceInfo={{
          id: 'someActor',
          type: 'actorReference',
          availability: UNAVAILABLE_NOT_FOUND,
          preview: {
            published: PUBLISHED_PREVIEW as DocumentPreview,
            draft: DRAFT_PREVIEW as DocumentPreview,
          },
        }}
      />
    )
    expect(getByTestId('alert-nonexistent-document')).toBeInTheDocument()
  })

  test('a warning is visible if the reference value is strong while the schema says it should be weak', () => {
    const {getByTestId} = render(
      <ReferenceInfoTester
        typeIsWeakRef
        value={{_type: 'reference', _ref: 'someActor'}}
        referenceInfo={{
          id: 'someActor',
          type: 'actorReference',
          availability: AVAILABLE,
          preview: {
            published: PUBLISHED_PREVIEW as DocumentPreview,
            draft: DRAFT_PREVIEW as DocumentPreview,
          },
        }}
      />
    )
    expect(getByTestId('alert-reference-strength-mismatch')).toBeInTheDocument()
  })
})
