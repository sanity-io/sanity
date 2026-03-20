import {render, screen} from '@testing-library/react'
import {defineConfig, type PerspectiveContextValue, useSearchState} from 'sanity'
import {describe, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {type DocumentListPaneNode, type StructureToolContextValue} from '../../../types'
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

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useSearchState: vi.fn(),
  useActiveReleases: vi.fn(() => ({})),
  usePerspective: vi.fn(
    (): PerspectiveContextValue => ({
      perspectiveStack: ['drafts'],
      excludedPerspectives: [],
      selectedPerspective: 'drafts',
      selectedPerspectiveName: undefined,
      selectedReleaseId: undefined,
    }),
  ),
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

    await screen.findByTestId('document-list-pane')
  })
})
