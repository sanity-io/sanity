// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {render, within} from '@testing-library/react'
import {RouterProvider} from '@sanity/state-router/components'
import {route} from '@sanity/state-router'
import React, {forwardRef, useImperativeHandle} from 'react'
import Schema from '@sanity/schema'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {Observable, of} from 'rxjs'
import {noop} from 'lodash'

import {AvailabilityReason} from '@sanity/base/_internal'
import {Reference} from '@sanity/types'
import userEvent from '@testing-library/user-event'
import {CrossDatasetReferenceInput, Props} from '../CrossDatasetReferenceInput'
import {CrossDatasetReferenceInfo, DocumentPreview, SearchHit} from '../types'
import {openElement, openHtml} from './utils/open-html'

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
      {
        name: 'actorReference',
        type: 'crossDatasetReference',
        weak: props.typeIsWeakRef,
        to: [{type: 'actor'}],
      },
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

describe('if schema type is a weak reference', () => {
  test('a warning is displayed if the reference value is strong while the schema says it should be weak', () => {
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
            published: {title: 'Actor (published)', description: ''} as DocumentPreview,
          },
        }}
      />
    )
    expect(getByTestId('alert-reference-strength-mismatch')).toBeInTheDocument()
  })
})

describe('user interaction', () => {
  test('support searching for references and emits patches when a reference is chosen', async () => {
    const handleSearch = jest.fn<Observable<SearchHit[]>, [string]>().mockReturnValue(
      of([
        {id: 'one', type: 'product', published: {_id: 'one', _type: 'product'}},
        {id: 'two', type: 'product', published: {_id: 'two', _type: 'product'}},
      ])
    )
    const handleChange = jest.fn()

    const schema = Schema.compile({
      types: [
        {
          name: 'productReference',
          type: 'crossDatasetReference',
          dataset: 'products',
          projectId: 'abcxyz',
          to: [{type: 'product'}],
        },
      ],
    })

    const {getByTestId} = render(
      <CrossDatasetReferenceInputTester
        value={undefined}
        type={schema.get('productReference')}
        onChange={handleChange}
        getReferenceInfo={(id) =>
          of({
            id,
            type: 'product',
            availability: AVAILABLE,
            preview: {
              published: {title: `Product ${id}`},
            },
          })
        }
        onSearch={handleSearch}
      />
    )

    const autocomplete = getByTestId('autocomplete')
    expect(autocomplete).toBeInTheDocument()
    userEvent.type(autocomplete, 'foo')

    expect(autocomplete).toBeInTheDocument()
    const popover = getByTestId('autocomplete-popover')
    expect(popover).toBeInTheDocument()

    const previews = within(popover).getAllByTestId('preview')

    expect(previews.length).toBe(2)
    expect(previews[0]).toHaveTextContent('Product one')
    expect(previews[1]).toHaveTextContent('Product two')
    // openElement(previews[1])
    userEvent.click(within(popover).getAllByRole('button')[1])
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange.mock.calls[0]).toEqual([
      {
        patches: [
          {type: 'setIfMissing', path: [], value: {}},
          {type: 'set', path: ['_type'], value: 'productReference'},
          {type: 'set', path: ['_ref'], value: 'two'},
          {type: 'set', path: ['_dataset'], value: 'products'},
          {type: 'set', path: ['_productId'], value: 'abcxyz'},
        ],
      },
    ])
  })
})
