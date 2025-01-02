import {act, fireEvent, render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {defineConfig} from 'sanity'
import {type DocumentListPaneNode} from 'sanity/structure'
import {beforeEach, describe, expect, it, vi} from 'vitest'

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
  return render(
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

describe('DocumentSheetListPane', () => {
  const user = userEvent.setup({
    skipClick: true,
    writeToClipboard: true,
    skipAutoClose: true,
  })

  beforeEach(async () => {
    // const originalClipboardWriteText = navigator.clipboard.writeText
    // Object.assign(navigator.clipboard, {
    //   writeText: vi.fn(),
    // })
    // return () => {
    //   Object.assign(navigator.clipboard, {writeText: originalClipboardWriteText})
    // }
  })

  describe('Keyboard navigation', () => {
    describe('to edit single value', () => {
      it('should not edit cell when only single clicked', async () => {
        const user = userEvent.setup()
        await renderTest()

        await user.click(screen.getByTestId('cell-name-0'))
        await user.type(screen.getByTestId('cell-name-0'), 'addition text')
        expect(screen.getByTestId('cell-name-0')).toHaveValue('John Doe')

        // await act(async () => {

        // })
      })

      it('should update cell when double clicked', async () => {
        await renderTest()

        await act(async () => {
          expect(screen.getByTestId('cell-name-0')).toHaveValue('John Doe')
          await user.dblClick(screen.getByTestId('cell-name-0'))
          await user.clear(screen.getByTestId('cell-name-0'))
          await user.type(screen.getByTestId('cell-name-0'), 'Jane Doe')

          expect(screen.getByTestId('cell-name-0')).toHaveValue('Jane Doe')
        })
      })

      it('should update cell when selected and enter key pressed', async () => {
        await renderTest()

        await act(async () => {
          await user.click(screen.getByTestId('cell-name-0'))
        })
        // separate act to allow for initial state flush before clicking enter
        await act(async () => {
          await user.type(screen.getByTestId('cell-name-0'), '{Enter}')
          await user.clear(screen.getByTestId('cell-name-0'))
          await user.type(screen.getByTestId('cell-name-0'), 'Jane Doe')

          expect(screen.getByTestId('cell-name-0')).toHaveValue('Jane Doe')
        })
      })
    })
    describe('to copy a value', () => {
      it('copies when cell is selected', async () => {
        const user = userEvent.setup({writeToClipboard: true})
        await renderTest()

        await user.click(screen.getByTestId('cell-name-0'))
        fireEvent.copy(document)

        const [item] = await navigator.clipboard.read()
        expect(await item.getType('text/plain')).toBe('John Doe')
      })
    })

    describe('to paste a value', () => {
      it('pastes when cell is selected', async () => {
        const user = userEvent.setup({writeToClipboard: true})
        await renderTest()

        await act(async () => {
          await user.click(screen.getByTestId('cell-name-0'))
        })

        expect(screen.getByTestId('cell-name-0')).toHaveAttribute('aria-selected', 'true')

        await user.paste('Joe Blogs')
        // act(() => {
        /*
          fireEvent.paste(document, {
            clipboardData: {
              getData: () => 'Joe Blogs',
            } as unknown as ClipboardEvent['clipboardData'],
          })
          // */
        // })

        expect(screen.getByTestId('cell-name-0')).toHaveValue('Joe Blogs')
      })

      it('pastes when cell is focused', async () => {
        await renderTest()

        await act(async () => {
          await user.click(screen.getByTestId('cell-name-0'))
          await user.type(screen.getByTestId('cell-name-0'), '{Enter}')
        })

        fireEvent.paste(document, {
          clipboardData: {
            getData: () => 'Joe Blogs',
          } as unknown as ClipboardEvent['clipboardData'],
        })

        expect(screen.getByTestId('cell-name-0')).toHaveValue('Joe Blogs')
      })

      it('pastes to all selected cells when anchor is selected', async () => {
        await renderTest()

        await act(async () => {
          await user.click(screen.getByTestId('cell-name-0'))
        })

        await act(async () => {
          await user.keyboard('{Shift}{ArrowDown}')
        })

        fireEvent.paste(document, {
          clipboardData: {
            getData: () => 'Joe Blogs',
          } as unknown as ClipboardEvent['clipboardData'],
        })

        expect(screen.getByTestId('cell-name-0')).toHaveValue('Joe Blogs')
        expect(screen.getByTestId('cell-name-1')).toHaveValue('Joe Blogs')
      })

      it('pastes to all selected cells when anchor is focused', async () => {
        await renderTest()

        await act(async () => {
          await user.dblClick(screen.getByTestId('cell-name-0'))
        })

        await act(async () => {
          await user.keyboard('{Shift}{ArrowDown}')
        })

        expect(screen.getByTestId('cell-name-0')).toHaveAttribute('aria-selected', 'true')
        expect(screen.getByTestId('cell-name-1')).toHaveAttribute('aria-selected', 'true')

        fireEvent.paste(document, {
          clipboardData: {
            getData: () => 'Joe Blogs',
          } as unknown as ClipboardEvent['clipboardData'],
        })

        expect(screen.getByTestId('cell-name-1')).toHaveValue('Joe Blogs')
      })

      it('does not paste when pasting across columns', async () => {
        await renderTest()

        await act(async () => {
          await user.click(screen.getByTestId('cell-name-0'))
        })

        await act(async () => {
          await user.keyboard('{Shift}{ArrowRight}')
        })

        expect(screen.getByTestId('cell-age-0')).toHaveAttribute('aria-selected', 'true')

        fireEvent.paste(document, {
          clipboardData: {
            getData: () => 'Joe Blogs',
          } as unknown as ClipboardEvent['clipboardData'],
        })
        // act(() => {
        // })

        expect(screen.getByTestId('cell-name-0')).toHaveValue('John Doe')
        expect(screen.getByTestId('cell-age-0')).toHaveValue('Joe Blogs')
      })

      it('pastes only to focused anchor when escaped before pasting', async () => {
        const user = userEvent.setup({writeToClipboard: true})
        await renderTest()

        await act(async () => {
          await user.dblClick(screen.getByTestId('cell-name-0'))
          await user.keyboard('{Shift}{ArrowRight}')
          await user.keyboard('{Escape}')
        })
        await act(async () => {
          await user.paste('Joe Blogs')
        })

        // act(() => {
        //   fireEvent.paste(document, {
        //     clipboardData: {
        //       getData: () => 'Joe Blogs',
        //     } as unknown as ClipboardEvent['clipboardData'],
        //   })
        // })

        expect(screen.getByTestId('cell-name-0')).toHaveValue('Joe Blogs')
        expect(screen.getByTestId('cell-name-1')).toHaveValue('Bill Bob')
      })

      it('does not paste when escaped before pasting', async () => {
        await renderTest()

        await user.dblClick(screen.getByTestId('cell-name-0'))
        await user.keyboard('{Escape}')
        await user.keyboard('{Escape}')
        fireEvent.paste(document, {
          clipboardData: {
            getData: () => 'Joe Blogs',
          } as unknown as ClipboardEvent['clipboardData'],
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
