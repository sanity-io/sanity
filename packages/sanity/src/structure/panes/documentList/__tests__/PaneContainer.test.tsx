import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {defineConfig, type PerspectiveContextValue} from 'sanity'
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

// Stub the list body so tests render the pane header (and its menu) without the
// heavy preview subtree, while preserving the testid the render test asserts on.
vi.mock('../DocumentListPane', async () => {
  const {createElement} = await import('react')
  return {
    DocumentListPane: () => createElement('div', {'data-testid': 'document-list-pane'}),
  }
})

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

  // Restoring must clear the shared per-type key, not write a concrete default
  // that would leak onto sibling lists. See issue #12835.
  it('restoring the default clears the persisted sort order instead of writing the configured default', async () => {
    const config = defineConfig({projectId: 'test', dataset: 'test'})
    const wrapper = await createTestProvider({
      config,
      resources: [structureUsEnglishLocaleBundle],
    })

    const setSortOrder = vi.fn()
    const setLayout = vi.fn()

    // The user has manually picked a non-default sort, so "Default sort" is
    // enabled (the persisted value differs from the configured defaultOrdering).
    const storedSortOrder = {by: [{field: '_updatedAt', direction: 'desc'}]}

    mockUseStructureToolSetting.mockImplementation(
      (namespace: string) =>
        (namespace === 'layout'
          ? ['default', setLayout]
          : [storedSortOrder, setSortOrder]) as ReturnType<typeof useStructureToolSetting>,
    )

    render(
      <PaneContainer
        paneKey="paneKey"
        index={1}
        itemId="123"
        pane={
          {
            id: 'books-by-title',
            options: {
              filter: '_type == $type',
              params: {type: 'book'},
              defaultOrdering: [{field: 'title', direction: 'asc'}],
            },
            menuItems: [
              {
                group: 'sorting',
                action: 'setSortOrder',
                title: 'Name',
                params: {by: [{field: 'name', direction: 'asc'}]},
              },
            ],
          } as unknown as DocumentListPaneNode
        }
      />,
      {wrapper},
    )

    await userEvent.click(await screen.findByTestId('pane-context-menu-button'))
    await userEvent.click(await screen.findByText('Default sort'))

    expect(setSortOrder).toHaveBeenCalledTimes(1)
    // A concrete sort order here leaks into every sibling list of the same type;
    // clearing (null) lets each list fall back to its own configured default.
    expect(setSortOrder).toHaveBeenCalledWith(null)
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
    const sortAndLayout: PaneMenuItem[] = [
      {group: 'sorting', action: 'setSortOrder', title: 'Last edited'},
      {group: 'layout', action: 'setLayout', title: 'Detailed view'},
    ]

    const result = appendRestoreDefaultItems({
      menuItems: sortAndLayout,
      isSortDefault: false,
      isLayoutDefault: false,
      restoreSortDisabledReason: 'sort',
      restoreLayoutDisabledReason: 'layout',
    })

    expect(result).toHaveLength(sortAndLayout.length + 2)
    expect(result.map((item) => item.action)).toContain('restoreDefaultSortOrder')
    expect(result.map((item) => item.action)).toContain('restoreDefaultLayout')
  })

  it('does not inject restore-default items when there are no menu items to attach to', () => {
    const result = appendRestoreDefaultItems({
      menuItems: [],
      isSortDefault: false,
      isLayoutDefault: false,
      restoreSortDisabledReason: 'sort',
      restoreLayoutDisabledReason: 'layout',
    })

    expect(result).toEqual([])
  })

  it('only appends the sort restore item when a sorting item is present', () => {
    const sortingOnly: PaneMenuItem[] = [
      {group: 'sorting', action: 'setSortOrder', title: 'Last edited'},
    ]

    const result = appendRestoreDefaultItems({
      menuItems: sortingOnly,
      isSortDefault: false,
      isLayoutDefault: false,
      restoreSortDisabledReason: 'sort',
      restoreLayoutDisabledReason: 'layout',
    })

    const actions = result.map((item) => item.action)
    expect(actions).toContain('restoreDefaultSortOrder')
    expect(actions).not.toContain('restoreDefaultLayout')
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
