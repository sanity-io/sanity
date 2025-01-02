import {fireEvent, render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {act} from 'react'
import {defineConfig} from 'sanity'
import {type DocumentListPaneNode} from 'sanity/structure'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../i18n'
import {DocumentSheetListPane} from '../DocumentSheetListPane'

vi.mock('../useDocumentSheetList', () => ({
  useDocumentSheetList: vi.fn().mockReturnValue({
    data: [
      {
        _id: '123',
        _type: 'author',
        name: 'John Doe',
        age: 42,
      },
      {
        _id: '456',
        _type: 'author',
        name: 'Bill Bob',
        age: 17,
      },
    ],
    isLoading: false,
  }),
}))

vi.mock('sanity', async () => ({
  ...((await vi.importActual('sanity')) || {}),
  useDocumentPreviewStore: vi.fn().mockReturnValue({
    observeForPreview: vi.fn().mockReturnValue([]),
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
    writeText: vi.fn(),
  },
})

describe('DocumentSheetListPane', () => {
  describe('Keyboard navigation', () => {
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

        act(() => {
          expect(screen.getByTestId('cell-name-0')).toHaveValue('John Doe')
          userEvent.dblClick(screen.getByTestId('cell-name-0'))
          userEvent.clear(screen.getByTestId('cell-name-0'))
          userEvent.type(screen.getByTestId('cell-name-0'), 'Jane Doe')

          expect(screen.getByTestId('cell-name-0')).toHaveValue('Jane Doe')
        })
      })

      it('should update cell when selected and enter key pressed', async () => {
        await renderTest()

        act(() => {
          userEvent.click(screen.getByTestId('cell-name-0'))
        })
        // separate act to allow for initial state flush before clicking enter
        act(() => {
          userEvent.type(screen.getByTestId('cell-name-0'), '{Enter}')
          userEvent.clear(screen.getByTestId('cell-name-0'))
          userEvent.type(screen.getByTestId('cell-name-0'), 'Jane Doe')

          expect(screen.getByTestId('cell-name-0')).toHaveValue('Jane Doe')
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
      })
    })
  })

  describe('Column Headers', () => {
    it('should render column headers', async () => {
      await renderTest()

      screen.getByText('Preview')
      screen.getByText('Name')
      screen.getByText('Age')
    })

    it('should not allow for hiding preview column', async () => {
      await renderTest()

      fireEvent.mouseMove(screen.getByText('Preview'))
      expect(
        within(screen.getByTestId('header-Preview')).queryByTestId('field-menu-button'),
      ).toBeNull()
    })

    it('should allow for hiding other columns', async () => {
      await renderTest()

      fireEvent.mouseMove(screen.getByText('Name'))

      expect(
        within(screen.getByTestId('header-name')).getByTestId('field-menu-button'),
      ).toBeInTheDocument()

      fireEvent.click(within(screen.getByTestId('header-name')).getByTestId('field-menu-button'))
      fireEvent.click(screen.getByText('Remove from table'))

      expect(screen.queryByText('Name')).toBeNull()
    })
  })
})
