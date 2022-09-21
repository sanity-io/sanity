/* eslint-disable camelcase */
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
import userEvent from '@testing-library/user-event'
import {CrossDatasetReferenceInput, Props} from '../CrossDatasetReferenceInput'
import {SearchHit} from '../types'

const EMPTY_SEARCH = () => of([])

export const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

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

describe('render states', () => {
  test('it renders the autocomplete when no value is given', () => {
    const schema = Schema.compile({
      types: [
        {
          name: 'productReference',
          type: 'crossDatasetReference',
          dataset: 'products',
          to: [{type: 'product'}],
        },
      ],
    })

    const {queryByTestId} = render(
      <CrossDatasetReferenceInputTester
        value={undefined}
        type={schema.get('productReference')}
        getReferenceInfo={({_id: id, _type: type}) =>
          of({
            id,
            type,
            availability: AVAILABLE,
            preview: {
              published: {title: `Product ${id}`},
            },
          })
        }
      />
    )

    expect(queryByTestId('autocomplete')).toBeInTheDocument()
  })

  test('it renders the autocomplete when it has a value but focus is on the _ref', () => {
    const schema = Schema.compile({
      types: [
        {
          name: 'productReference',
          type: 'crossDatasetReference',
          dataset: 'products',
          to: [
            {
              type: 'product',
              preview: {
                select: {
                  title: 'title',
                },
              },
            },
          ],
        },
      ],
    })

    const {getByTestId} = render(
      <CrossDatasetReferenceInputTester
        value={{_type: 'productReference', _ref: 'foo', _dataset: 'foo', _projectId: 'foo'}}
        focusPath={['_ref']}
        type={schema.get('productReference')}
        getReferenceInfo={jest.fn().mockReturnValue(
          of({
            _id: 'foo',
            type: 'product',
            availability: AVAILABLE,
            preview: {
              published: {title: `Foo`},
            },
          })
        )}
      />
    )
    expect(getByTestId('autocomplete')).toBeInTheDocument()
  })

  test('a warning is displayed if the reference value is strong while the schema says it should be weak', () => {
    const schema = Schema.compile({
      types: [
        {
          name: 'productReference',
          type: 'crossDatasetReference',
          dataset: 'products',
          weak: true,
          to: [
            {
              type: 'product',
              preview: {
                select: {
                  title: 'title',
                },
              },
            },
          ],
        },
      ],
    })
    const {getByTestId} = render(
      <CrossDatasetReferenceInputTester
        type={schema.get('productReference')}
        value={{
          _type: 'reference',
          _ref: 'someActor',
          _dataset: 'otherDataset',
          _projectId: 'otherProject',
        }}
        getReferenceInfo={jest.fn().mockReturnValue(
          of({
            _id: 'foo',
            type: 'product',
            availability: AVAILABLE,
            preview: {
              published: {title: `Foo`},
            },
          })
        )}
      />
    )
    expect(getByTestId('alert-reference-strength-mismatch')).toBeInTheDocument()
  })
})

describe('user interaction happy paths', () => {
  test('an input without a value support searching for references and emits patches when a reference is chosen', async () => {
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
          to: [
            {
              type: 'product',
              preview: {
                select: {
                  title: 'title',
                },
              },
            },
          ],
        },
      ],
    })

    const {getByTestId} = render(
      <CrossDatasetReferenceInputTester
        value={undefined}
        type={schema.get('productReference')}
        onChange={handleChange}
        getReferenceInfo={({_id: id, _type: type}) =>
          of({
            id,
            type,
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
    userEvent.type(autocomplete, 'foo')
    const popover = getByTestId('autocomplete-popover')

    const previews = within(popover).getAllByTestId('preview')

    expect(previews.length).toBe(2)
    expect(previews[0]).toHaveTextContent('Product one')
    expect(previews[1]).toHaveTextContent('Product two')

    userEvent.click(within(popover).getAllByRole('button')[1])

    // Note: this asserts the necessity of awaiting after click. Currently, the onChange event is emitted asynchronously after an item is selected due to behavior in Sanity UI's autocomplete
    // (https://github.com/sanity-io/design/blob/b956686c2c663c4f21910f7d3d0be0a27663f5f4/packages/%40sanity/ui/src/components/autocomplete/autocompleteOption.tsx#L16-L20)
    // if this tests suddenly fails this expectation, it can be removed along with the waiting
    expect(handleChange).toHaveBeenCalledTimes(0)
    await wait(1)
    //----

    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange.mock.calls[0]).toEqual([
      {
        patches: [
          {
            path: [],
            type: 'set',
            value: {
              _dataset: 'products',
              _projectId: 'mock-project-id',
              _ref: 'two',
              _type: 'productReference',
            },
          },
        ],
      },
    ])
  })
  test('an input with an existing value support replacing the value, and emits patches when a new reference is chosen', async () => {
    const handleSearch = jest.fn<Observable<SearchHit[]>, [string]>().mockReturnValue(
      of([
        {id: 'one', type: 'product', published: {_id: 'one', _type: 'product'}},
        {id: 'two', type: 'product', published: {_id: 'two', _type: 'product'}},
      ])
    )

    const handleChange = jest.fn()
    const handleFocus = jest.fn()

    const schema = Schema.compile({
      types: [
        {
          name: 'productReference',
          type: 'crossDatasetReference',
          dataset: 'products',
          to: [
            {
              type: 'product',
              preview: {
                select: {
                  title: 'title',
                },
              },
            },
          ],
        },
      ],
    })

    const value = {
      _type: 'productReference',
      _ref: 'some-product',
      _dataset: 'products',
      _projectId: 'mock-project-id',
    }
    const getReferenceInfo = ({_id: id}) =>
      of({
        id,
        type: 'product',
        availability: AVAILABLE,
        preview: {
          published: {title: `Product ${id}`},
        },
      })

    const {getByTestId, rerender} = render(
      <CrossDatasetReferenceInputTester
        value={value}
        type={schema.get('productReference')}
        onChange={handleChange}
        onFocus={handleFocus}
        getReferenceInfo={getReferenceInfo}
        onSearch={handleSearch}
      />
    )
    const preview = getByTestId('preview')
    expect(preview).toHaveTextContent('Product some-product')
    const menuButton = getByTestId('menu-button')
    menuButton.click()
    const replaceMenuItem = getByTestId('menu-item-replace')

    replaceMenuItem.click()

    expect(handleFocus).toHaveBeenCalledTimes(1)
    expect(handleFocus).toHaveBeenCalledWith(['_ref'])
    rerender(
      <CrossDatasetReferenceInputTester
        value={value}
        type={schema.get('productReference')}
        onChange={handleChange}
        focusPath={['_ref']}
        onFocus={handleFocus}
        getReferenceInfo={getReferenceInfo}
        onSearch={handleSearch}
      />
    )
    const autocomplete = getByTestId('autocomplete')
    userEvent.type(autocomplete, 'foo')
    const popover = getByTestId('autocomplete-popover')

    const previews = within(popover).getAllByTestId('preview')

    expect(previews.length).toBe(2)
    expect(previews[0]).toHaveTextContent('Product one')
    expect(previews[1]).toHaveTextContent('Product two')

    userEvent.click(within(popover).getAllByRole('button')[1])

    // Note: this asserts the necessity of awaiting after click. Currently, the onChange event is emitted asynchronously after an item is selected due to behavior in Sanity UI's autocomplete
    // (https://github.com/sanity-io/design/blob/b956686c2c663c4f21910f7d3d0be0a27663f5f4/packages/%40sanity/ui/src/components/autocomplete/autocompleteOption.tsx#L16-L20)
    // if this tests suddenly fails this expectation, it can be removed along with the waiting
    expect(handleChange).toHaveBeenCalledTimes(0)
    await wait(1)
    //----

    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange.mock.calls[0]).toEqual([
      {
        patches: [
          {
            path: [],
            type: 'set',
            value: {
              _dataset: 'products',
              _projectId: 'mock-project-id',
              _ref: 'two',
              _type: 'productReference',
            },
          },
        ],
      },
    ])
  })
  test('an input with an existing value support clearing the value', () => {
    const handleChange = jest.fn()
    const handleFocus = jest.fn()

    const schema = Schema.compile({
      types: [
        {
          name: 'productReference',
          type: 'crossDatasetReference',
          dataset: 'products',
          to: [
            {
              type: 'product',
              preview: {
                select: {
                  title: 'title',
                },
              },
            },
          ],
        },
      ],
    })

    const value = {
      _type: 'productReference',
      _ref: 'some-product',
      _dataset: 'products',
      _projectId: 'mock-project-id',
    }
    const getReferenceInfo = ({_id: id}) =>
      of({
        id,
        type: 'product',
        availability: AVAILABLE,
        preview: {
          published: {title: `Product ${id}`},
        },
      })

    const {getByTestId} = render(
      <CrossDatasetReferenceInputTester
        value={value}
        type={schema.get('productReference')}
        onChange={handleChange}
        onFocus={handleFocus}
        getReferenceInfo={getReferenceInfo}
      />
    )
    const preview = getByTestId('preview')
    expect(preview).toHaveTextContent('Product some-product')
    const menuButton = getByTestId('menu-button')
    menuButton.click()
    const replaceMenuItem = getByTestId('menu-item-clear')

    replaceMenuItem.click()

    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange.mock.calls[0]).toEqual([
      {
        patches: [
          {
            path: [],
            type: 'unset',
          },
        ],
      },
    ])
  })
})
