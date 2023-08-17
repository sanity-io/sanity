/* eslint-disable camelcase */

import {act, waitForElementToBeRemoved, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import {Observable, of} from 'rxjs'
import {SanityClient} from '@sanity/client'
import {renderCrossDatasetReferenceInput} from '../../../../../../test/form'
import {CrossDatasetReferenceInput} from '../CrossDatasetReferenceInput'
import {CrossDatasetSearchHit} from '../types'
import {defineConfig} from '../../../../config'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {featureDisabledRequest, featureEnabledRequest} from './mocks'

const AVAILABLE = {
  available: true,
  reason: 'READABLE',
} as const

function createWrapperComponent(client: SanityClient) {
  const config = defineConfig({
    projectId: 'mock-project-id',
    dataset: 'test',
  })

  return createTestProvider({
    client,
    config,
  })
}

describe('render states', () => {
  test('it renders the autocomplete when no value is given', async () => {
    const client = createMockSanityClient({requests: {'/features': featureEnabledRequest}})
    const TestProvider = await createWrapperComponent(client as any)

    const getReferenceInfo = ({_id: id, _type: type}: {_id: string; _type?: string}) => {
      return of({
        id,
        type,
        availability: AVAILABLE,
        preview: {
          published: {title: `Product ${id}`},
        },
      })
    }

    const {result} = await renderCrossDatasetReferenceInput({
      fieldDefinition: {
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
      } as any,
      getReferenceInfo,
      render: (inputProps) => {
        return (
          <TestProvider>
            <CrossDatasetReferenceInput {...inputProps} />
          </TestProvider>
        )
      },
    })

    expect(result.queryByTestId('autocomplete')).toBeInTheDocument()
  })

  test('it renders the autocomplete when it has a value but focus is on the _ref', async () => {
    const client = createMockSanityClient({requests: {'/features': featureEnabledRequest}})
    const TestProvider = await createWrapperComponent(client as any)

    const getReferenceInfo = jest.fn().mockReturnValue(
      of({
        _id: 'foo',
        type: 'product',
        availability: AVAILABLE,
        preview: {
          published: {title: `Foo`},
        },
      }),
    )

    const value = {
      _type: 'productReference',
      _ref: 'foo',
      _dataset: 'foo',
      _projectId: 'foo',
    }

    const {result} = await renderCrossDatasetReferenceInput({
      fieldDefinition: {
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
      } as any,
      getReferenceInfo,
      render: (inputProps) => {
        return (
          <TestProvider>
            <CrossDatasetReferenceInput {...inputProps} focusPath={['_ref']} value={value} />
          </TestProvider>
        )
      },
    })

    expect(result.getByTestId('autocomplete')).toBeInTheDocument()
  })

  test.skip('a warning is displayed if the reference value is strong while the schema says it should be weak', async () => {
    const client = createMockSanityClient({requests: {'/features': featureEnabledRequest}})
    const TestProvider = await createWrapperComponent(client as any)

    const getReferenceInfo = jest.fn().mockReturnValue(
      of({
        _id: 'foo',
        type: 'product',
        availability: AVAILABLE,
        preview: {
          published: {title: `Foo`},
        },
      }),
    )

    const value = {
      _type: 'reference',
      _ref: 'someActor',
      _dataset: 'otherDataset',
      _projectId: 'mock-project-id',
    }

    const {result} = await renderCrossDatasetReferenceInput({
      fieldDefinition: {
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
      } as any,
      getReferenceInfo,
      render: (inputProps) => {
        return (
          <TestProvider>
            <CrossDatasetReferenceInput {...inputProps} focusPath={['_ref']} value={value} />
          </TestProvider>
        )
      },
    })

    expect(result.getByTestId('alert-reference-strength-mismatch')).toBeInTheDocument()
  })

  // @todo Need to update useFeatureEnabled so we can skip caching for the feature check
  test.skip('a warning is displayed if there is a reference value and the feature is disabled', async () => {
    const client = createMockSanityClient({requests: {'/features': featureDisabledRequest}})
    const TestProvider = await createWrapperComponent(client as any)

    const getReferenceInfo = jest.fn().mockReturnValue(
      of({
        _id: 'foo',
        type: 'product',
        availability: AVAILABLE,
        preview: {
          published: {title: `Foo`},
        },
      }),
    )

    const value = {
      _type: 'reference',
      _ref: 'someActor',
      _dataset: 'otherDataset',
      _projectId: 'otherProject',
    }

    const {result} = await renderCrossDatasetReferenceInput({
      fieldDefinition: {
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
      } as any,
      getReferenceInfo,
      render: (inputProps) => {
        return (
          <TestProvider>
            <CrossDatasetReferenceInput {...inputProps} value={value} />
          </TestProvider>
        )
      },
    })

    expect(result.getByTestId('alert-cross-dataset-reference-feature-disabled')).toBeInTheDocument()
  })
})

describe('user interaction happy paths', () => {
  test.skip('an input without a value support searching for references and emits patches when a reference is chosen', async () => {
    const client = createMockSanityClient({requests: {'/features': featureEnabledRequest}})
    const TestProvider = await createWrapperComponent(client as any)

    const handleSearch = jest.fn<Observable<CrossDatasetSearchHit[]>, [string]>().mockReturnValue(
      of([
        {id: 'one', type: 'product', published: {_id: 'one', _type: 'product'}},
        {id: 'two', type: 'product', published: {_id: 'two', _type: 'product'}},
      ]),
    )

    const getReferenceInfo = ({_id: id, _type: type}: {_id: string; _type?: string}) =>
      of({
        id,
        type,
        availability: AVAILABLE,
        preview: {
          published: {title: `Product ${id}`},
        },
      })

    const {onChange, result} = await renderCrossDatasetReferenceInput({
      getReferenceInfo,
      onSearch: handleSearch,
      fieldDefinition: {
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
      } as any,
      render: (inputProps) => (
        <TestProvider>
          <CrossDatasetReferenceInput {...inputProps} />
        </TestProvider>
      ),
    })

    const autocomplete = await result.findByTestId('autocomplete')

    act(() => userEvent.type(autocomplete, 'foo'))

    const popover = await result.findByTestId('autocomplete-popover')
    const previews = within(popover).getAllByTestId('preview')

    expect(previews.length).toBe(2)
    expect(previews[0]).toHaveTextContent('Product one')
    expect(previews[1]).toHaveTextContent('Product two')

    // Click "Product two"
    userEvent.click(within(popover).getAllByRole('button')[1])

    // Note: this asserts the necessity of awaiting after click. Currently, the onChange event is
    // emitted asynchronously after an item is selected due to behavior in Sanity UI's autocomplete
    // (https://github.com/sanity-io/design/blob/b956686c2c663c4f21910f7d3d0be0a27663f5f4/packages/%40sanity/ui/src/components/autocomplete/autocompleteOption.tsx#L16-L20)
    // if this tests suddenly fails this expectation, it can be removed along with the waiting
    expect(onChange).toHaveBeenCalledTimes(0)
    await waitForElementToBeRemoved(() => result.getByTestId('autocomplete-popover'))
    //----

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0]).toEqual([
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

  // todo: look into why these fails
  test.skip('an input with an existing value support replacing the value, and emits patches when a new reference is chosen', async () => {
    const client = createMockSanityClient({requests: {'/features': featureEnabledRequest}})
    const TestProvider = await createWrapperComponent(client as any)

    const handleSearch = jest.fn<Observable<CrossDatasetSearchHit[]>, [string]>().mockReturnValue(
      of([
        {id: 'one', type: 'product', published: {_id: 'one', _type: 'product'}},
        {id: 'two', type: 'product', published: {_id: 'two', _type: 'product'}},
      ]),
    )

    const getReferenceInfo = ({_id: id}: {_id: string}) =>
      of({
        id,
        type: 'product',
        availability: AVAILABLE,
        preview: {
          published: {title: `Product ${id}`},
        },
      })

    const value = {
      _type: 'productReference',
      _ref: 'some-product',
      _dataset: 'products',
      _projectId: 'mock-project-id',
    }

    const {onChange, onPathFocus, rerender, result} = await renderCrossDatasetReferenceInput({
      getReferenceInfo,
      onSearch: handleSearch,

      fieldDefinition: {
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
      } as any,

      render: (inputProps) => (
        <TestProvider>
          <CrossDatasetReferenceInput {...inputProps} value={value} />,
        </TestProvider>
      ),
    })

    const preview = result.getByTestId('preview')
    expect(preview).toHaveTextContent('Product some-product')
    const menuButton = result.getByTestId('menu-button')
    menuButton.click()
    const replaceMenuItem = result.getByTestId('menu-item-replace')
    replaceMenuItem.click()
    expect(onPathFocus).toHaveBeenCalledTimes(1)
    expect(onPathFocus).toHaveBeenCalledWith(['_ref'])

    rerender((inputProps) => (
      <TestProvider>
        <CrossDatasetReferenceInput {...inputProps} focusPath={['_ref']} />
      </TestProvider>
    ))

    // rerender({
    //   focusPath: ['_ref'],
    // })

    const autocomplete = result.getByTestId('autocomplete')
    userEvent.type(autocomplete, 'foo')
    const popover = result.getByTestId('autocomplete-popover')
    const previews = within(popover).getAllByTestId('preview')

    expect(previews.length).toBe(2)
    expect(previews[0]).toHaveTextContent('Product one')
    expect(previews[1]).toHaveTextContent('Product two')

    userEvent.click(within(popover).getAllByRole('button')[1])

    // Note: this asserts the necessity of awaiting after click. Currently, the onChange event is emitted asynchronously after an item is selected due to behavior in Sanity UI's autocomplete
    // (https://github.com/sanity-io/design/blob/b956686c2c663c4f21910f7d3d0be0a27663f5f4/packages/%40sanity/ui/src/components/autocomplete/autocompleteOption.tsx#L16-L20)
    // if this tests suddenly fails this expectation, it can be removed along with the waiting
    expect(onChange).toHaveBeenCalledTimes(0)
    // await wait(1)
    await waitForElementToBeRemoved(() => result.getByTestId('autocomplete-popover'))
    //----

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0]).toEqual([
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

  test('an input with an existing value support clearing the value', async () => {
    const client = createMockSanityClient({requests: {'/features': featureEnabledRequest}})
    const TestProvider = await createWrapperComponent(client as any)

    const getReferenceInfo = ({_id: id}: {_id: string}) =>
      of({
        id,
        type: 'product',
        availability: AVAILABLE,
        preview: {
          published: {title: `Product ${id}`},
        },
      })

    const value = {
      _type: 'productReference',
      _ref: 'some-product',
      _dataset: 'products',
      _projectId: 'mock-project-id',
    }

    const {onChange, result} = await renderCrossDatasetReferenceInput({
      getReferenceInfo,

      fieldDefinition: {
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
      } as any,

      render: (inputProps) => (
        <TestProvider>
          <CrossDatasetReferenceInput {...inputProps} value={value} />,
        </TestProvider>
      ),
    })

    const preview = result.getByTestId('preview')
    expect(preview).toHaveTextContent('Product some-product')
    const menuButton = result.getByTestId('menu-button')
    await act(() => menuButton.click())
    const replaceMenuItem = result.getByTestId('menu-item-clear')
    await act(() => replaceMenuItem.click())

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0]).toEqual([
      {
        patchType: Symbol.for('sanity.patch'),
        path: [],
        type: 'unset',
      },
    ])
  })
})
