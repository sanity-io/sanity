import {render, screen} from '@testing-library/react'
import {defineConfig, type PerspectiveContextValue, useSearchState} from 'sanity'
import {describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {
  type DocumentListPaneNode,
  type PaneMenuItem,
  type StructureToolContextValue,
} from '../../../types'
import {useStructureToolSetting} from '../../../useStructureToolSetting'
import {DEFAULT_ORDERING} from '../constants'
import {
  addSelectedStateToMenuItems,
  appendRestoreDefaultItems,
  PaneContainer,
} from '../PaneContainer'

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
      selectedVariant: undefined,
      bundle: 'drafts',
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

describe('appendRestoreDefaultItems', () => {
  const menuItems: PaneMenuItem[] = [
    {group: 'sorting', action: 'setSortOrder', title: 'Last edited'},
  ]

  it('returns the input untouched when restore defaults are suppressed', () => {
    const result = appendRestoreDefaultItems({
      menuItems,
      isSortDefault: false,
      isLayoutDefault: false,
      restoreSortDisabledReason: 'sort',
      restoreLayoutDisabledReason: 'layout',
      suppressRestoreDefaults: true,
    })

    expect(result).toEqual(menuItems)
  })

  it('appends restore-default items when not suppressed', () => {
    const result = appendRestoreDefaultItems({
      menuItems,
      isSortDefault: false,
      isLayoutDefault: false,
      restoreSortDisabledReason: 'sort',
      restoreLayoutDisabledReason: 'layout',
    })

    expect(result).toHaveLength(menuItems.length + 2)
    expect(result.map((item) => item.action)).toContain('restoreDefaultSortOrder')
    expect(result.map((item) => item.action)).toContain('restoreDefaultLayout')
  })
})

describe('addSelectedStateToMenuItems', () => {
  it('selects the menu item whose sort order matches DEFAULT_ORDERING', () => {
    const menuItems: PaneMenuItem[] = [
      {
        group: 'sorting',
        action: 'setSortOrder',
        title: 'Last edited',
        params: {by: DEFAULT_ORDERING.by},
      },
      {
        group: 'sorting',
        action: 'setSortOrder',
        title: 'Created',
        params: {by: [{field: '_createdAt', direction: 'desc'}]},
      },
    ]

    const result = addSelectedStateToMenuItems({menuItems, sortOrderRaw: DEFAULT_ORDERING})

    expect(result?.[0].selected).toBe(true)
    expect(result?.[1].selected).toBe(false)
  })
})
