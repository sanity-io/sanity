import {type GlobalDocumentReferenceValue} from '@sanity/types'
import {act, waitForElementToBeRemoved, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {of} from 'rxjs'
import {describe, expect, test, vi} from 'vitest'

import {renderGlobalDocumentReferenceInput} from '../../../../../../test/form'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {set} from '../../../patch/patch'
import {GlobalDocumentReferenceInput} from '../GlobalDocumentReferenceInput'

const AVAILABLE = {
  available: true,
  reason: 'READABLE',
} as const

function createWrapperComponent() {
  return createTestProvider({})
}

describe('render states', () => {
  test('it renders the autocomplete when no value is given', async () => {
    const TestProvider = await createWrapperComponent()

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

    const {result} = await renderGlobalDocumentReferenceInput({
      fieldDefinition: {
        name: 'productReference',
        type: 'globalDocumentReference',
        resourceType: 'dataset',
        resourceId: 'myProject.myDataset',
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
      getReferenceInfo,
      render: (inputProps) => {
        return (
          <TestProvider>
            <GlobalDocumentReferenceInput {...inputProps} />
          </TestProvider>
        )
      },
    })

    expect(result.queryByTestId('autocomplete')).toBeInTheDocument()
  })

  test('it renders the autocomplete when it has a value but focus is on the _ref', async () => {
    const TestProvider = await createWrapperComponent()

    const getReferenceInfo = vi.fn(() =>
      of({
        id: 'foo',
        type: 'product',
        availability: AVAILABLE,
        preview: {
          published: {title: `Foo`},
        },
      }),
    )

    const value = {
      _type: 'productReference',
      _ref: 'dataset:myProject.myDataset:foo',
    } satisfies GlobalDocumentReferenceValue

    const {result} = await renderGlobalDocumentReferenceInput({
      fieldDefinition: {
        name: 'productReference',
        type: 'globalDocumentReference',
        resourceType: 'dataset',
        resourceId: 'myProject.myDataset',
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
      getReferenceInfo,
      render: (inputProps) => {
        return (
          <TestProvider>
            <GlobalDocumentReferenceInput {...inputProps} focusPath={['_ref']} value={value} />
          </TestProvider>
        )
      },
    })

    expect(result.getByTestId('autocomplete')).toBeInTheDocument()
  })

  test('a warning is displayed if the reference value is strong while the schema says it should be weak', async () => {
    const TestProvider = await createWrapperComponent()

    const getReferenceInfo = vi.fn(() =>
      of({
        id: 'foo',
        type: 'product',
        availability: AVAILABLE,
        preview: {
          published: {title: `Foo`},
        },
      }),
    )

    const value = {
      _type: 'globalDocumentReference',
      _ref: 'dataset:myProject.myDataset:someActor',
      _weak: true,
    } satisfies GlobalDocumentReferenceValue

    const {result} = await renderGlobalDocumentReferenceInput({
      fieldDefinition: {
        name: 'productReference',
        type: 'globalDocumentReference',
        resourceType: 'dataset',
        resourceId: 'myProject.myDataset',
        weak: false,
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
      getReferenceInfo,
      render: (inputProps) => {
        return (
          <TestProvider>
            <GlobalDocumentReferenceInput {...inputProps} value={value} />
          </TestProvider>
        )
      },
    })

    expect(result.getByTestId('alert-reference-strength-mismatch')).toBeInTheDocument()
  })
})

describe('user interaction happy paths', () => {
  test.skip('an input without a value support searching for references and emits patches when a reference is chosen', async () => {
    const TestProvider = await createWrapperComponent()

    const handleSearch = vi.fn(() =>
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

    const {onChange, result} = await renderGlobalDocumentReferenceInput({
      getReferenceInfo,
      onSearch: handleSearch,
      fieldDefinition: {
        name: 'productReference',
        type: 'globalDocumentReference',
        resourceType: 'dataset',
        resourceId: 'myProject.myDataset',
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
      render: (inputProps) => (
        <TestProvider>
          <GlobalDocumentReferenceInput {...inputProps} />
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
    userEvent.click(previews[1])

    // Note: this asserts the necessity of awaiting after click. Currently, the onChange event is
    // emitted asynchronously after an item is selected due to behavior in Sanity UI's autocomplete
    // (https://github.com/sanity-io/design/blob/b956686c2c663c4f21910f7d3d0be0a27663f5f4/packages/%40sanity/ui/src/components/autocomplete/autocompleteOption.tsx#L16-L20)
    // if this tests suddenly fails this expectation, it can be removed along with the waiting
    expect(onChange).toHaveBeenCalledTimes(0)
    await waitForElementToBeRemoved(() => result.getByTestId('autocomplete-popover'), {
      timeout: 1000,
    })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0]).toEqual([
      set({
        _type: 'globalDocumentReference',
        _ref: `dataset:myProject.myDataset:two`,
        _weak: undefined,
        _key: undefined,
      }),
    ])
  })

  test.skip('an input with an existing value support replacing the value, and emits patches when a new reference is chosen', async () => {
    const TestProvider = await createWrapperComponent()

    const handleSearch = vi.fn(() =>
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
      _type: 'globalDocumentReference',
      _ref: 'dataset:myProject.myDataset:some-product',
    } satisfies GlobalDocumentReferenceValue

    const {onChange, onPathFocus, result} = await renderGlobalDocumentReferenceInput({
      getReferenceInfo,
      onSearch: handleSearch,

      fieldDefinition: {
        name: 'productReference',
        type: 'globalDocumentReference',
        resourceType: 'dataset',
        resourceId: 'myProject.myDataset',
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

      render: (inputProps) => (
        <TestProvider>
          <GlobalDocumentReferenceInput {...inputProps} value={value} />,
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

    // rerender((inputProps) => (
    //   <TestProvider>
    //     <GlobalDocumentReferenceInput {...inputProps} focusPath={['_ref']} />
    //   </TestProvider>
    // ))

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

    userEvent.click(previews[1])

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
              _ref: 'dataset:myProject.myDataset:two',
              _type: 'globalDocumentReference',
            },
          },
        ],
      },
    ])
  })

  test('an input with an existing value support clearing the value', async () => {
    const TestProvider = await createWrapperComponent()

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
      _ref: 'dataset:myProject.myDataset:some-product',
    } satisfies GlobalDocumentReferenceValue

    const {onChange, result} = await renderGlobalDocumentReferenceInput({
      getReferenceInfo,

      fieldDefinition: {
        name: 'productReference',
        type: 'globalDocumentReference',
        resourceType: 'dataset',
        resourceId: 'myProject.myDataset',
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

      render: (inputProps) => (
        <TestProvider>
          <GlobalDocumentReferenceInput {...inputProps} value={value} />,
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
  }, 15000)
})
