import {act, render, screen, waitFor} from '@testing-library/react'
import {defineConfig, useSearchState} from 'sanity'
import {type DocumentListPaneNode, type StructureToolContextValue} from 'sanity/structure'
import {describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {useStructureToolSetting} from '../../../useStructureToolSetting'
import {PaneContainer} from '../PaneContainer'

vi.mock('../../../useStructureToolSetting', () => ({
  useStructureToolSetting: vi.fn(),
}))

vi.mock('../../../useStructureTool', () => ({
  useStructureTool: vi.fn().mockReturnValue({features: {}} as StructureToolContextValue),
}))
vi.mock('../../../components/pane/usePaneLayout', () => ({
  usePaneLayout: vi.fn().mockReturnValue({panes: [], mount: vi.fn()}),
}))

vi.mock('../sheetList/useDocumentSheetList', () => ({
  useDocumentSheetList: vi.fn().mockReturnValue({data: [], isLoading: false}),
}))

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useSearchState: vi.fn(),
  useActiveReleases: vi.fn(() => ({})),
  usePerspective: vi.fn(() => ({perspective: undefined})),
}))
vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn().mockReturnValue({
    stickyParams: {},
    state: {},
    navigate: vi.fn(),
  }),
}))

const mockUseSearchState = useSearchState as Mock

const mockUseStructureToolSetting = useStructureToolSetting as Mock<typeof useStructureToolSetting>

describe('PaneContainer', () => {
  it('should show the document list pane when a list layout is selected', async () => {
    const config = defineConfig({
      projectId: 'test',
      dataset: 'test',
    })

    const wrapper = await createTestProvider({
      config,
      resources: [structureUsEnglishLocaleBundle],
    })
    mockUseStructureToolSetting.mockReturnValue(['compact', vi.fn()])
    render(
      <PaneContainer
        paneKey="paneKey"
        index={1}
        itemId="123"
        pane={{options: {}} as DocumentListPaneNode}
      />,
      {wrapper},
    )

    await waitFor(() => expect(screen.getByTestId('document-list-pane')).toBeInTheDocument())
    expect(screen.queryByTestId('document-sheet-list-pane')).toBeNull()
  })

  it('should show the document sheet list pane when the sheet layout is selected', async () => {
    const mockDispatch = vi.fn()
    const config = defineConfig({
      projectId: 'test',
      dataset: 'test',
      schema: {
        types: [
          {
            type: 'document',
            name: 'author',
            fields: [{type: 'string', name: 'name'}],
          },
        ],
      },
    })

    const wrapper = await createTestProvider({
      config,
      resources: [structureUsEnglishLocaleBundle],
    })
    mockUseStructureToolSetting.mockReturnValue(['sheetList', vi.fn()])
    // Mock return value for useSearchState
    mockUseSearchState.mockReturnValue({
      state: {
        result: {hits: [], error: null, loading: false},
      },
      dispatch: mockDispatch,
    })

    render(
      <PaneContainer
        paneKey="paneKey"
        index={1}
        itemId="123"
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
    act(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'TERMS_TYPE_ADD',
        schemaType: expect.objectContaining({
          name: 'author',
        }),
      })
    })
    screen.getByTestId('document-sheet-list-pane')
    expect(screen.queryByTestId('document-list-pane')).toBeNull()
  })
})
