import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {act} from 'react'
import {defineConfig, type OperationsAPI} from 'sanity'
import {type DocumentListPaneNode} from 'sanity/structure'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../i18n'
import {DocumentSheetListPane} from '../DocumentSheetListPane'
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

const renderTest = async () => {
  const config = defineConfig({
    projectId: 'test',
    dataset: 'test',
    schema: {
      preview: {},
      types: [
        {
          type: 'document',
          name: 'author',
          fields: [
            {type: 'string', name: 'name'},
            {type: 'number', name: 'age'},
            {
              name: 'address',
              type: 'object',
              fields: [
                {name: 'city', type: 'string'},
                {name: 'country', type: 'string'},
              ],
            },
          ],
        },
      ],
    },
  })

  const wrapper = await createTestProvider({
    config,
    resources: [structureUsEnglishLocaleBundle],
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
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Keyboard navigation', () => {
    const mockDocumentOperations = {
      patch: {disabled: false, execute: jest.fn()},
      commit: {disabled: false, execute: jest.fn()},
    } as unknown as OperationsAPI

    beforeEach(() => {
      mockUseDocumentSheetList.mockReturnValue({
        'pub-123': mockDocumentOperations,
        'pub-456': mockDocumentOperations,
      })
    })

    describe('to edit single value', () => {
      it('should not edit cell when only single clicked', async () => {
        await renderTest()

        act(() => {
          userEvent.click(screen.getByTestId('cell-name-0'))
          userEvent.type(screen.getByTestId('cell-name-0'), 'addition text')

          expect(screen.getByTestId('cell-name-0')).toHaveValue('John Doe')
        })
      })

      it('should update cell when double clicked', async () => {
        await renderTest()

        await act(async () => {
          expect(screen.getByTestId('cell-name-0')).toHaveValue('John Doe')
          await userEvent.dblClick(screen.getByTestId('cell-name-0'))
        })

        await act(async () => {
          userEvent.keyboard('Jane Doe')
        })

        await waitFor(() => {
          expect(screen.getByTestId('cell-name-0')).toHaveValue('Jane Doe')
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
          userEvent.click(screen.getByTestId('cell-name-0'))
        })

        // separate act to allow for initial state flush before clicking enter
        act(() => {
          userEvent.type(screen.getByTestId('cell-name-0'), '{Enter}')
          userEvent.keyboard('Jane Doe')

          expect(screen.getByTestId('cell-name-0')).toHaveValue('Jane Doe')

          // escape to persist the update
          userEvent.type(screen.getByTestId('cell-name-0'), '{Escape}')
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
      it('pastes when cell is selected', async () => {
        await renderTest()

        await act(() => {
          userEvent.click(screen.getByTestId('cell-name-0'))
        })

        expect(screen.getByTestId('cell-name-0')).toHaveAttribute('aria-selected', 'true')

        act(() => {
          fireEvent.paste(document, {
            clipboardData: {
              getData: () => 'Joe Blogs',
            } as unknown as ClipboardEvent['clipboardData'],
          })
        })

        expect(screen.getByTestId('cell-name-0')).toHaveValue('Joe Blogs')

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
          userEvent.click(screen.getByTestId('cell-name-0'))
          userEvent.type(screen.getByTestId('cell-name-0'), '{Enter}')
        })

        act(() => {
          fireEvent.paste(document, {
            clipboardData: {
              getData: () => 'Joe Blogs',
            } as unknown as ClipboardEvent['clipboardData'],
          })
        })

        expect(screen.getByTestId('cell-name-0')).toHaveValue('Joe Blogs')

        await waitFor(() => {
          expect(mockDocumentOperations.patch.execute).toHaveBeenCalledWith(
            [{set: {name: 'Joe Blogs'}}],
            {},
          )
          expect(mockDocumentOperations.commit.execute).toHaveBeenCalled()
        })
      })

      it('pastes to all selected cells when anchor is selected', async () => {
        await renderTest()

        await act(() => {
          userEvent.click(screen.getByTestId('cell-name-0'))
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

        expect(screen.getByTestId('cell-name-0')).toHaveValue('Joe Blogs')
        expect(screen.getByTestId('cell-name-1')).toHaveValue('Joe Blogs')
      })

      it('pastes to all selected cells when anchor is focused', async () => {
        await renderTest()

        await act(() => {
          userEvent.dblClick(screen.getByTestId('cell-name-0'))
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

        expect(screen.getByTestId('cell-name-1')).toHaveValue('Joe Blogs')

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
          userEvent.click(screen.getByTestId('cell-name-0'))
        })

        act(() => {
          userEvent.keyboard('{Shift}{ArrowRight}')
        })

        expect(screen.getByTestId('cell-age-0')).toHaveAttribute('aria-selected', 'true')

        act(() => {
          fireEvent.paste(document, {
            clipboardData: {
              getData: () => 'Joe Blogs',
            } as unknown as ClipboardEvent['clipboardData'],
          })
        })

        expect(screen.getByTestId('cell-name-0')).toHaveValue('John Doe')
        expect(screen.getByTestId('cell-age-0')).toHaveValue('Joe Blogs')
      })

      it('pastes only to focused anchor when escaped before pasting', async () => {
        await renderTest()

        await act(async () => {
          await userEvent.click(screen.getByTestId('cell-name-0'))
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

        expect(screen.getByTestId('cell-name-0')).toHaveValue('Joe Blogs')
        expect(screen.getByTestId('cell-name-1')).toHaveValue('Bill Bob')

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

        expect(screen.getByTestId('cell-name-0')).toHaveValue('John Doe')

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
})
