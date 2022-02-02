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
import {CrossDatasetReferenceInput, Props} from '../CrossDatasetReferenceInput'
import {CrossDatasetReferenceInfo, DocumentPreview} from '../types'

const EMPTY_SEARCH = () => of([])

const AVAILABLE = {
  available: true,
  reason: AvailabilityReason.READABLE,
} as const

type InfinityNoop = () => InfinityNoop
const infinityNoop: InfinityNoop = new Proxy(() => infinityNoop, {get: () => infinityNoop})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StubComponent = forwardRef(
  ({documentId, documentType}: {documentId: string; documentType: string}, ref) => {
    useImperativeHandle(ref, () => infinityNoop, [])
    return null
  }
)
StubComponent.displayName = 'StubComponent'
type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

function CrossDatasetReferenceInputTester(
  props: PartialExcept<Props, 'type' | 'getReferenceInfo'>
) {
  const onFocus = jest.fn()
  const onChange = jest.fn()

  return (
    <RouterProvider router={route.intents('/intents')} state={{}} onNavigate={noop}>
      <ThemeProvider scheme="light" theme={studioTheme}>
        <ToastProvider>
          <LayerProvider>
            <CrossDatasetReferenceInput
              onReconfigureToken={noop}
              onFocus={onFocus}
              onChange={onChange}
              markers={[]}
              level={0}
              focusPath={[]}
              presence={[]}
              onSearch={EMPTY_SEARCH}
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
    referenceInfo: CrossDatasetReferenceInfo
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
    <CrossDatasetReferenceInputTester
      getReferenceInfo={(id: string) => of(props.referenceInfo)}
      onSearch={EMPTY_SEARCH}
      focusPath={props.isEditing ? ['_ref'] : []}
      type={schema.get('actorReference')}
      value={props.value}
    />
  )
}

const PUBLISHED_PREVIEW = {title: 'Actor (published)', description: ''}

describe('if schema type is a weak reference', () => {
  test('a warning is visible if the reference value is strong while the schema says it should be weak', () => {
    const {getByTestId} = render(
      <ReferenceInfoTester
        typeIsWeakRef
        value={{
          _type: 'reference',
          _ref: 'someActor',
          _dataset: 'otherDataset',
          _projectId: 'otherProject',
        }}
        referenceInfo={{
          id: 'someActor',
          type: 'actorReference',
          availability: AVAILABLE,
          preview: {
            published: PUBLISHED_PREVIEW as DocumentPreview,
          },
        }}
      />
    )
    expect(getByTestId('alert-reference-strength-mismatch')).toBeInTheDocument()
  })
})
