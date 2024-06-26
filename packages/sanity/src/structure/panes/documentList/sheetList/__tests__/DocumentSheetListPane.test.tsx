import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {cloneDeep, merge} from 'lodash'
import {act} from 'react'
import {defineConfig, type OperationsAPI} from 'sanity'
import {type DocumentListPaneNode} from 'sanity/structure'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../i18n'
import {DocumentSheetListPane} from '../DocumentSheetListPane'
import {SheetListUsEnglishLocaleBundle} from '../i18n'
import {useDocumentSheetListOperations} from '../useDocumentSheetListOperations'

jest.mock('../useDocumentSheetList', () => ({
  useDocumentSheetList: jest.fn().mockReturnValue({
    data: [
      {
        _id: '123',
        _type: 'author',
        __metadata: {
          idPair: {
            publishedId: 'pub-123',
            draftId: 'draft-123',
          },
          snapshots: {published: {}},
        },
        name: 'John Doe',
        age: 42,
        address: {
          city: 'Oslo',
          country: 'Norway',
        },
        isAdult: true,
      },
      {
        _id: '456',
        _type: 'author',
        __metadata: {
          idPair: {
            publishedId: 'pub-456',
            draftId: 'draft-456',
          },
          snapshots: {published: {}},
        },
        name: 'Bill Bob',
        age: 17,
        address: {
          city: 'Oslo',
          country: 'Norway',
        },
        isAdult: false,
      },
    ],
    isLoading: false,
  }),
}))

jest.mock('../useDocumentSheetListOperations', () => ({
  useDocumentSheetListOperations: jest.fn(),
}))

const mockUseDocumentSheetList = useDocumentSheetListOperations as jest.Mock<
  typeof useDocumentSheetListOperations
>

jest.mock('sanity', () => ({
  ...(jest.requireActual('sanity') || {}),
  useDocumentPreviewStore: jest.fn().mockReturnValue({
    observeForPreview: jest.fn().mockReturnValue([]),
  }),
}))

jest.mock('../../../../components/paneRouter', () => ({
  usePaneRouter: jest.fn().mockReturnValue({
    ChildLink: jest.fn().mockReturnValue(null),
  }),
}))

const DEFAULT_TEST_CONFIG = Object.freeze({
  projectId: 'test',
  dataset: 'test',
  schema: {
    preview: {},
    types: [
      {
        type: 'document',
        name: 'author',
        fields: [
          {type: 'string', name: 'name', readOnly: false},
          {type: 'number', name: 'age', readOnly: false},
          {
            name: 'address',
            type: 'object',
            fields: [
              {name: 'city', type: 'string', readOnly: false},
              {name: 'country', type: 'string', readOnly: false},
            ],
          },
        ],
      },
    ],
  },
})

const renderTest = async (providedConfig: any = {}) => {
  const config = defineConfig(merge({}, DEFAULT_TEST_CONFIG, providedConfig))

  const wrapper = await createTestProvider({
    config,
    resources: [structureUsEnglishLocaleBundle, SheetListUsEnglishLocaleBundle],
  })
  render(
    <DocumentSheetListPane
      paneKey={'123'}
      index={0}
      itemId={'123'}
      pane={
        {
          id: 'author',
          schemaTypeName: 'author',
          options: {},
        } as DocumentListPaneNode
      }
    />,
    {wrapper},
  )
}

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
})

describe('DocumentSheetListPane', () => {
  const mockDocumentOperations = {
    patch: {disabled: false, execute: jest.fn()},
    commit: {disabled: false, execute: jest.fn()},
  } as unknown as OperationsAPI

  beforeEach(() => {
    mockUseDocumentSheetList.mockReturnValue({
      'pub-123': mockDocumentOperations,
      'pub-456': mockDocumentOperations,
    })
    jest.clearAllMocks()
  })

  describe('Keyboard navigation', () => {
    describe('to edit single value', () => {
      it('should not edit cell when only single clicked', async () => {
        await renderTest()

        act(() => {
          userEvent.click(screen.getByTestId('cell-name-0'))
          userEvent.type(screen.getByTestId('cell-name-0'), 'addition text')

          expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('John Doe')
        })
      })

      it('should update cell when double clicked', async () => {
        await renderTest()

        await act(async () => {
          expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('John Doe')
          await userEvent.dblClick(screen.getByTestId('cell-name-0-input-field'))
        })

        await waitFor(() => {
          expect(screen.getByTestId('cell-name-0')).toHaveAttribute('aria-selected', 'true')
        })

        await act(async () => {
          userEvent.keyboard('Jane Doe')
        })

        await waitFor(() => {
          expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('Jane Doe')
        })

        // enter to persist the update
        await act(async () => {
          await userEvent.type(screen.getByTestId('cell-name-0'), '{Enter}')
        })

        // assert that update is made to server
        expect(mockDocumentOperations.patch.execute).toHaveBeenCalledWith(
          [{set: {name: 'Jane Doe'}}],
          {},
        )
        expect(mockDocumentOperations.commit.execute).toHaveBeenCalled()
      })

      it('should update cell when selected and enter key pressed', async () => {
        await renderTest()

        act(() => {
          userEvent.click(screen.getByTestId('cell-name-0-input-field'))
        })

        // separate act to allow for initial state flush before clicking enter
        act(() => {
          userEvent.type(screen.getByTestId('cell-name-0-input-field'), '{Enter}')
          userEvent.keyboard('Jane Doe')

          expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('Jane Doe')

          // enter to persist the update
          userEvent.type(screen.getByTestId('cell-name-0'), '{Enter}')
        })

        // assert that update is made to server
        await waitFor(() => {
          expect(mockDocumentOperations.patch.execute).toHaveBeenCalledWith(
            [{set: {name: 'Jane Doe'}}],
            {},
          )
          expect(mockDocumentOperations.commit.execute).toHaveBeenCalled()
        })
      })

      it('should not update cell when escape pressed after change', async () => {
        await renderTest()

        act(() => {
          userEvent.click(screen.getByTestId('cell-name-0-input-field'))
        })

        // separate act to allow for initial state flush before clicking enter
        act(() => {
          userEvent.type(screen.getByTestId('cell-name-0'), '{Enter}')
          userEvent.keyboard('Jane Doe')

          // value has been updated locally
          expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('Jane Doe')

          // escape to cancel the update
          userEvent.type(screen.getByTestId('cell-name-0'), '{Escape}')
        })

        // assert NO update request is made to server
        await waitFor(() => {
          expect(mockDocumentOperations.patch.execute).not.toHaveBeenCalled()
          expect(mockDocumentOperations.commit.execute).not.toHaveBeenCalled()
        })

        // value should be reverted to original
        expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('John Doe')
      })
    })

    describe.each(['Backspace', 'Delete'])('to delete a value', (key) => {
      it('deletes when cell is selected', async () => {
        await renderTest()

        await act(async () => {
          userEvent.click(screen.getByTestId('cell-name-0'))
        })

        await act(async () => {
          await userEvent.type(screen.getByTestId('cell-name-0'), `{${key}}`)
        })

        // assert that update is made to server
        await waitFor(() => {
          expect(mockDocumentOperations.patch.execute).toHaveBeenCalledWith([{unset: ['name']}], {})
          expect(mockDocumentOperations.commit.execute).toHaveBeenCalled()
        })

        await waitFor(() => {
          expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('')
        })
      })

      it('does not delete when cell is focused', async () => {
        await renderTest()

        await act(async () => {
          expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('John Doe')
          await userEvent.dblClick(screen.getByTestId('cell-name-0'))
        })

        await act(async () => {
          await userEvent.type(screen.getByTestId('cell-name-0'), `{${key}}`)
        })

        // assert that update is made to server
        await waitFor(() => {
          expect(mockDocumentOperations.patch.execute).not.toHaveBeenCalled()
          expect(mockDocumentOperations.commit.execute).not.toHaveBeenCalled()
        })

        await waitFor(() => {
          expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('John Doe')
        })
      })

      it('deletes all values when cells are selected', async () => {
        await renderTest()

        await act(() => {
          userEvent.click(screen.getByTestId('cell-name-0'))
        })

        await act(() => {
          userEvent.keyboard('{Shift}{ArrowDown}')
        })

        await act(() => {
          userEvent.type(document.activeElement!, `{${key}}`)
        })

        // assert that update is made to server
        await waitFor(() => {
          expect(mockDocumentOperations.patch.execute).toHaveBeenNthCalledWith(
            1,
            [{unset: ['name']}],
            {},
          )
          expect(mockDocumentOperations.patch.execute).toHaveBeenNthCalledWith(
            2,
            [{unset: ['name']}],
            {},
          )
          expect(mockDocumentOperations.commit.execute).toHaveBeenCalledTimes(2)
        })

        await waitFor(() => {
          expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('')
          expect(screen.getByTestId('cell-name-1-input-field')).toHaveValue('')
        })
      })
    })

    describe('to copy a value', () => {
      it('copies when cell is selected', async () => {
        await renderTest()

        await act(() => {
          userEvent.click(screen.getByTestId('cell-name-0'))
        })

        act(() => {
          fireEvent.copy(document)
        })

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('John Doe')
      })
    })

    describe('to paste a value', () => {
      it('does not paste when cell is read only', async () => {
        const providedConfig = cloneDeep(DEFAULT_TEST_CONFIG)
        providedConfig.schema.types[0].fields[0].readOnly = true
        await renderTest(providedConfig)

        await act(() => {
          userEvent.click(screen.getByTestId('cell-name-0-input-field'))
        })

        expect(screen.getByTestId('cell-name-0')).toHaveAttribute('aria-selected', 'true')

        act(() => {
          fireEvent.paste(document, {
            clipboardData: {
              getData: () => 'Joe Blogs',
            } as unknown as ClipboardEvent['clipboardData'],
          })
        })

        expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('John Doe')

        expect(mockDocumentOperations.patch.execute).not.toHaveBeenCalled()
        expect(mockDocumentOperations.commit.execute).not.toHaveBeenCalled()
      })

      it('pastes when cell is selected', async () => {
        await renderTest()

        await act(() => {
          userEvent.click(screen.getByTestId('cell-name-0-input-field'))
        })

        expect(screen.getByTestId('cell-name-0')).toHaveAttribute('aria-selected', 'true')

        act(() => {
          fireEvent.paste(document, {
            clipboardData: {
              getData: () => 'Joe Blogs',
            } as unknown as ClipboardEvent['clipboardData'],
          })
        })

        expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('Joe Blogs')

        await waitFor(() => {
          expect(mockDocumentOperations.patch.execute).toHaveBeenCalledWith(
            [{set: {name: 'Joe Blogs'}}],
            {},
          )
          expect(mockDocumentOperations.commit.execute).toHaveBeenCalled()
        })
      })

      it('pastes when cell is focused', async () => {
        await renderTest()

        await act(() => {
          userEvent.click(screen.getByTestId('cell-name-0-input-field'))
          userEvent.type(screen.getByTestId('cell-name-0-input-field'), '{Enter}')
        })

        act(() => {
          fireEvent.paste(document, {
            clipboardData: {
              getData: () => 'Joe Blogs',
            } as unknown as ClipboardEvent['clipboardData'],
          })
        })

        expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('Joe Blogs')

        await waitFor(() => {
          expect(mockDocumentOperations.patch.execute).toHaveBeenCalledWith(
            [{set: {name: 'Joe Blogs'}}],
            {},
          )
          expect(mockDocumentOperations.commit.execute).toHaveBeenCalled()
        })
      })

      it('does not paste to any cells when field is read only', async () => {
        const providedConfig = cloneDeep(DEFAULT_TEST_CONFIG)
        providedConfig.schema.types[0].fields[0].readOnly = true
        await renderTest(providedConfig)

        await act(() => {
          userEvent.click(screen.getByTestId('cell-name-0-input-field'))
        })

        await act(() => {
          userEvent.keyboard('{Shift}{ArrowDown}')
        })

        act(() => {
          fireEvent.paste(document, {
            clipboardData: {
              getData: () => 'Joe Blogs',
            } as unknown as ClipboardEvent['clipboardData'],
          })
        })

        expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('John Doe')
        expect(screen.getByTestId('cell-name-1-input-field')).toHaveValue('Bill Bob')

        expect(mockDocumentOperations.patch.execute).not.toHaveBeenCalled()
        expect(mockDocumentOperations.commit.execute).not.toHaveBeenCalled()
      })

      it('pastes to all selected cells when anchor is selected', async () => {
        await renderTest()

        await act(() => {
          userEvent.click(screen.getByTestId('cell-name-0-input-field'))
        })

        await act(() => {
          userEvent.keyboard('{Shift}{ArrowDown}')
        })

        act(() => {
          fireEvent.paste(document, {
            clipboardData: {
              getData: () => 'Joe Blogs',
            } as unknown as ClipboardEvent['clipboardData'],
          })
        })

        expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('Joe Blogs')
        expect(screen.getByTestId('cell-name-1-input-field')).toHaveValue('Joe Blogs')
      })

      it('pastes to all selected cells when anchor is focused', async () => {
        await renderTest()

        await act(() => {
          userEvent.dblClick(screen.getByTestId('cell-name-0-input-field'))
        })

        await act(() => {
          userEvent.keyboard('{Shift}{ArrowDown}')
        })

        expect(screen.getByTestId('cell-name-0')).toHaveAttribute('aria-selected', 'true')
        expect(screen.getByTestId('cell-name-1')).toHaveAttribute('aria-selected', 'true')

        act(() => {
          fireEvent.paste(document, {
            clipboardData: {
              getData: () => 'Joe Blogs',
            } as unknown as ClipboardEvent['clipboardData'],
          })
        })

        expect(screen.getByTestId('cell-name-1-input-field')).toHaveValue('Joe Blogs')

        await waitFor(() => {
          expect(mockDocumentOperations.patch.execute).toHaveBeenNthCalledWith(
            1,
            [{set: {name: 'Joe Blogs'}}],
            {},
          )
          expect(mockDocumentOperations.patch.execute).toHaveBeenNthCalledWith(
            2,
            [{set: {name: 'Joe Blogs'}}],
            {},
          )
          expect(mockDocumentOperations.commit.execute).toHaveBeenCalledTimes(2)
        })
      })

      it('does not paste when pasting across columns', async () => {
        await renderTest()

        await act(() => {
          userEvent.click(screen.getByTestId('cell-name-0-input-field'))
        })

        // select age cell
        await act(async () => {
          await userEvent.keyboard('{Shift}{ArrowRight}')
        })
        await waitFor(() => {
          expect(screen.getByTestId('cell-age-0')).toHaveAttribute('aria-selected', 'true')
        })

        // select address cell
        await act(async () => {
          await userEvent.keyboard('{Shift}{ArrowRight}')
        })
        await waitFor(() => {
          expect(screen.getByTestId('cell-address_city-0')).toHaveAttribute('aria-selected', 'true')
        })

        act(() => {
          fireEvent.paste(document, {
            clipboardData: {
              getData: () => 'Joe Blogs',
            } as unknown as ClipboardEvent['clipboardData'],
          })
        })

        expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('John Doe')
        expect(screen.getByTestId('cell-age-0-input-field')).toHaveValue(42)
        expect(screen.getByTestId('cell-address_city-0-input-field')).toHaveValue('Joe Blogs')
      })

      it('pastes only to focused anchor when escaped before pasting', async () => {
        await renderTest()

        await act(async () => {
          await userEvent.click(screen.getByTestId('cell-name-0-input-field'))
          await userEvent.keyboard('{Shift}{ArrowRight}')
          await userEvent.keyboard('{Escape}')
        })

        act(() => {
          fireEvent.paste(document, {
            clipboardData: {
              getData: () => 'Joe Blogs',
            } as unknown as ClipboardEvent['clipboardData'],
          })
        })

        expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('Joe Blogs')
        expect(screen.getByTestId('cell-name-1-input-field')).toHaveValue('Bill Bob')

        await waitFor(() => {
          expect(mockDocumentOperations.patch.execute).toHaveBeenCalledWith(
            [{set: {name: 'Joe Blogs'}}],
            {},
          )

          expect(mockDocumentOperations.commit.execute).toHaveBeenCalled()
        })
      })

      it('does not paste when escaped before pasting', async () => {
        await renderTest()

        await act(async () => {
          await userEvent.dblClick(screen.getByTestId('cell-name-0'))
          await userEvent.keyboard('{Escape}')
          await userEvent.keyboard('{Escape}')
          fireEvent.paste(document, {
            clipboardData: {
              getData: () => 'Joe Blogs',
            } as unknown as ClipboardEvent['clipboardData'],
          })
        })

        expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('John Doe')

        expect(mockDocumentOperations.patch.execute).not.toHaveBeenCalled()
        expect(mockDocumentOperations.commit.execute).not.toHaveBeenCalled()
      })
    })
  })

  describe('Column Headers', () => {
    it('should render column headers', async () => {
      await renderTest()

      screen.getByText('List preview')
      screen.getByText('Name')
      screen.getByText('Age')
    })

    it('should not allow for hiding preview column', async () => {
      await renderTest()

      fireEvent.mouseMove(screen.getByText('List preview'))
      expect(
        within(screen.getByTestId('header-Preview')).queryByTestId('field-menu-button'),
      ).toBeNull()
    })

    it('should allow for hiding other columns', async () => {
      await renderTest()

      fireEvent.mouseMove(screen.getByText('Name'))

      expect(
        within(screen.getByTestId('header-1_name_name')).getByTestId('field-menu-button'),
      ).toBeVisible()

      fireEvent.click(
        within(screen.getByTestId('header-1_name_name')).getByTestId('field-menu-button'),
      )
      fireEvent.click(screen.getByText('Remove from table'))

      expect(screen.queryByText('Name')).toBeNull()
    })
    it('should hide the children columns if the parent is removed', async () => {
      await renderTest()

      fireEvent.mouseMove(screen.getByText('address'))
      expect(screen.queryByText('City')).toBeVisible()
      expect(screen.queryByText('Country')).toBeVisible()

      expect(
        within(screen.getByTestId('header-1_address_address_city')).getByTestId(
          'field-menu-button',
        ),
      ).toBeVisible()

      fireEvent.click(
        within(screen.getByTestId('header-1_address_address_city')).getByTestId(
          'field-menu-button',
        ),
      )
      fireEvent.click(screen.getByText('Remove from table'))

      expect(screen.queryByText('City')).toBeNull()
      expect(screen.queryByText('Country')).toBeNull()
    })
  })

  describe('inputs', () => {
    describe('text inputs', () => {
      it('should disable when read only', async () => {
        const providedConfig = DEFAULT_TEST_CONFIG
        providedConfig.schema.types[0].fields[0].readOnly = true
        await renderTest(providedConfig)

        expect(screen.getByTestId('cell-name-0-input-field')).toHaveAttribute('readOnly')
      })

      it.each(['email', 'number', 'url', 'date'])(
        'it should render %s input type',
        async (type) => {
          const providedConfig = DEFAULT_TEST_CONFIG
          providedConfig.schema.types[0].fields[0].type = type
          await renderTest(providedConfig)

          expect(screen.getByTestId('cell-name-0-input-field')).toHaveAttribute('type', type)
        },
      )
    })

    describe('booleans', () => {
      describe.each(['checkbox', 'switch', undefined])('as a %s', (layout) => {
        let providedConfig: any
        beforeEach(() => {
          providedConfig = DEFAULT_TEST_CONFIG
          providedConfig.schema.types[0].fields[0] = {
            type: 'boolean',
            name: 'isAdult',
            readOnly: false,
            ...(layout ? {options: {layout}} : {}),
          }
        })

        it('should disable checkbox if field is ready only', async () => {
          providedConfig.schema.types[0].fields[0].readOnly = true
          await renderTest(providedConfig)

          expect(screen.getByTestId('cell-isAdult-0-input-field')).toBeDisabled()
        })

        it('should render as checkbox', async () => {
          await renderTest(providedConfig)

          expect(screen.getByTestId('cell-isAdult-0-input-field')).toHaveAttribute(
            'type',
            'checkbox',
          )
        })

        it('should update value when option selected', async () => {
          await renderTest(providedConfig)

          // initially checked field to be unchecked
          expect(screen.getByTestId('cell-isAdult-0-input-field')).toBeChecked()
          fireEvent.click(screen.getByTestId('cell-isAdult-0-input-field'))

          await waitFor(() => {
            expect(mockDocumentOperations.patch.execute).toHaveBeenCalledWith(
              [{set: {isAdult: false}}],
              {},
            )
            expect(mockDocumentOperations.commit.execute).toHaveBeenCalled()
          })

          // initially unchecked field to be checked
          expect(screen.getByTestId('cell-isAdult-1-input-field')).not.toBeChecked()
          fireEvent.click(screen.getByTestId('cell-isAdult-1-input-field'))

          await waitFor(() => {
            expect(mockDocumentOperations.patch.execute).toHaveBeenCalledWith(
              [{set: {isAdult: true}}],
              {},
            )
            expect(mockDocumentOperations.commit.execute).toHaveBeenCalled()
          })
        })

        it('should unset value to indeterminate when deleted', async () => {
          await renderTest(providedConfig)
          await act(() => {
            userEvent.click(screen.getByTestId('cell-isAdult-0'))
          })

          await waitFor(() => {
            expect(screen.getByTestId('cell-isAdult-0')).toHaveAttribute('aria-selected', 'true')
          })

          await userEvent.type(screen.getByTestId('cell-isAdult-0'), `{Backspace}`)

          await waitFor(() => {
            expect(mockDocumentOperations.patch.execute).toHaveBeenCalledWith(
              [{unset: ['isAdult']}],
              {},
            )
            expect(mockDocumentOperations.commit.execute).toHaveBeenCalled()
          })
        })
      })
    })

    describe('selects', () => {
      const providedConfig = cloneDeep(DEFAULT_TEST_CONFIG)
      beforeEach(() => {
        providedConfig.schema.types[0].fields[0] = {
          type: 'string',
          name: 'name',
          readOnly: false,
          options: {
            list: [
              {title: 'John Doe', value: 'John Doe'},
              {title: 'Jane Doe', value: 'Jane Doe'},
            ],
          },
        } as any
      })

      it('should disable select if field is ready only', async () => {
        providedConfig.schema.types[0].fields[0].readOnly = true
        await renderTest(providedConfig)

        expect(screen.getByTestId('cell-name-0-input-field')).toBeDisabled()
      })

      it('should render the existing value', async () => {
        await renderTest(providedConfig)

        expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('John Doe')
      })

      it('should give the option to select a different value', async () => {
        await renderTest(providedConfig)

        userEvent.selectOptions(screen.getByTestId('cell-name-0-input-field'), 'Jane Doe')

        expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('Jane Doe')

        await waitFor(() => {
          expect(mockDocumentOperations.patch.execute).toHaveBeenCalledWith(
            [{set: {name: 'Jane Doe'}}],
            {},
          )
          expect(mockDocumentOperations.commit.execute).toHaveBeenCalled()
        })
      })

      it('should give the option to unset the value', async () => {
        await renderTest(providedConfig)

        await userEvent.selectOptions(screen.getByTestId('cell-name-0-input-field'), '')

        await waitFor(() => {
          expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('')
        })

        await waitFor(() => {
          expect(mockDocumentOperations.patch.execute).toHaveBeenCalledWith([{unset: ['name']}], {})
          expect(mockDocumentOperations.commit.execute).toHaveBeenCalled()
        })
      })

      it('should allow for unset when deleting', async () => {
        await renderTest(providedConfig)

        await act(() => {
          userEvent.click(screen.getByTestId('cell-name-0'))
        })

        await waitFor(() => {
          expect(screen.getByTestId('cell-name-0')).toHaveAttribute('aria-selected', 'true')
        })

        await userEvent.type(screen.getByTestId('cell-name-0'), `{Backspace}`)

        await waitFor(() => {
          expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('')
        })

        await waitFor(() => {
          expect(mockDocumentOperations.patch.execute).toHaveBeenCalledWith([{unset: ['name']}], {})
          expect(mockDocumentOperations.commit.execute).toHaveBeenCalled()
        })
      })
    })

    describe('radios', () => {
      const providedConfig = cloneDeep(DEFAULT_TEST_CONFIG)
      beforeEach(() => {
        providedConfig.schema.types[0].fields[0] = {
          type: 'string',
          name: 'name',
          readOnly: false,
          options: {
            layout: 'radio',
            list: [
              {title: 'John Doe', value: 'John Doe'},
              {title: 'Jane Doe', value: 'Jane Doe'},
            ],
          },
        } as any
      })

      it('should disable radio if field is ready only', async () => {
        providedConfig.schema.types[0].fields[0].readOnly = true
        await renderTest(providedConfig)

        expect(screen.getByTestId('cell-name-0-input-field')).toBeDisabled()
      })

      it('should should not give option to unset if value already present', async () => {
        await renderTest(providedConfig)

        expect(screen.queryByRole('option', {name: ''})).toBeNull()
      })

      it('should render the current value', async () => {
        await renderTest(providedConfig)

        expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('John Doe')
      })

      it('should give the option to select a different value', async () => {
        await renderTest(providedConfig)

        userEvent.selectOptions(screen.getByTestId('cell-name-0-input-field'), 'Jane Doe')

        expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('Jane Doe')

        await waitFor(() => {
          expect(mockDocumentOperations.patch.execute).toHaveBeenCalledWith(
            [{set: {name: 'Jane Doe'}}],
            {},
          )
          expect(mockDocumentOperations.commit.execute).toHaveBeenCalled()
        })
      })

      it('should give an unset option when the value is currently unset', async () => {
        providedConfig.schema.types[0].fields[0] = {
          name: 'occupation',
          type: 'string',
          readOnly: false,
          options: {
            layout: 'radio',
            list: [
              {title: 'Developer', value: 'Developer'},
              {title: 'Designer', value: 'Designer'},
            ],
          },
        } as any
        await renderTest(providedConfig)

        expect(screen.getByTestId('cell-occupation-0-input-field')).toHaveValue('')

        expect(within(screen.getByTestId('cell-occupation-0')).queryByRole('option', {name: ''}))

        await userEvent.selectOptions(
          screen.getByTestId('cell-occupation-0-input-field'),
          'Developer',
        )

        await waitFor(() => {
          expect(screen.getByTestId('cell-occupation-0-input-field')).toHaveValue('Developer')
        })

        await waitFor(() => {
          expect(mockDocumentOperations.patch.execute).toHaveBeenCalledWith(
            [{set: {occupation: 'Developer'}}],
            {},
          )
          expect(mockDocumentOperations.commit.execute).toHaveBeenCalled()
        })

        expect(
          within(screen.getByTestId('cell-occupation-0')).queryByRole('option', {name: ''}),
        ).toBeNull()
      })

      it('should allow for unset when deleting', async () => {
        await renderTest(providedConfig)

        await act(() => {
          userEvent.click(screen.getByTestId('cell-name-0'))
        })

        await waitFor(() => {
          expect(screen.getByTestId('cell-name-0')).toHaveAttribute('aria-selected', 'true')
        })

        await userEvent.type(screen.getByTestId('cell-name-0'), `{Backspace}`)

        await waitFor(() => {
          expect(screen.getByTestId('cell-name-0-input-field')).toHaveValue('')
        })

        await waitFor(() => {
          expect(mockDocumentOperations.patch.execute).toHaveBeenCalledWith([{unset: ['name']}], {})
          expect(mockDocumentOperations.commit.execute).toHaveBeenCalled()
        })
      })
    })
  })
})
