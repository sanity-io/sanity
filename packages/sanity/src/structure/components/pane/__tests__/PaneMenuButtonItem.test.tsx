import {Menu} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {PaneMenuButtonItem} from '../PaneMenuButtonItem'
import {type _PaneMenuGroup} from '../types'

/**
 * Regression test for https://github.com/sanity-io/sanity/issues/13238.
 *
 * When a pane action menu is built via S.menuItemGroup() (or via the
 * resolveMenuNodes path that always sets expanded: true), the group's
 * configured `title` is currently dropped on the floor by the renderer:
 * the expanded branch of PaneMenuButtonItem only emits a MenuDivider and
 * the group's children, never the title.
 *
 * This test fails on main and pins the expected behavior: when a group
 * has a title, that title should be visible somewhere in the rendered
 * output (e.g. as a section label).
 */
describe('PaneMenuButtonItem regression (#13238)', () => {
  it('renders the group title for an expanded menu item group', async () => {
    const client = createMockSanityClient()
    const wrapper = await createTestProvider({
      client: client as any,
      config: {projectId: 'test', dataset: 'test'},
      resources: [structureUsEnglishLocaleBundle],
    })

    const group: _PaneMenuGroup = {
      type: 'group',
      key: 'view-group',
      title: 'Display Options',
      expanded: true,
      renderAsButton: false,
      children: [
        {
          type: 'item',
          key: 'grid-view',
          title: 'Grid View',
          icon: undefined,
          renderAsButton: false,
          onAction: () => {},
        },
      ],
    }

    render(
      <Menu>
        <PaneMenuButtonItem isAfterGroup={false} node={group} />
      </Menu>,
      {wrapper},
    )

    // Child should always render.
    expect(screen.getByText('Grid View')).toBeInTheDocument()

    // The group title is set via .title() on S.menuItemGroup() and is part
    // of the public structureBuilder API; it must be visible in the menu.
    // Currently fails because the expanded branch in PaneMenuButtonItem
    // drops the title entirely (only a MenuDivider is rendered between groups).
    expect(screen.getByText('Display Options')).toBeInTheDocument()
  })
})
