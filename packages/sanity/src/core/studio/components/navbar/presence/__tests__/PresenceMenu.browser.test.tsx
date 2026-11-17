import {BoundaryElementProvider} from '@sanity/ui'
import {describe, expect, test, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type GlobalPresence} from '../../../../../store/presence/types'
import {PresenceMenu} from '../PresenceMenu'

// The presence store needs the studio's bifur connection; the hook is mocked at
// the module seam with a fixed list of users instead.
vi.mock('../../../../../store/presence/useGlobalPresence', () => ({
  useGlobalPresence: () => PRESENCE,
}))

// Grants come from `/projects/<id>/grants`; answer the invite check statically.
vi.mock('../../useCanInviteMembers', () => ({
  useCanInviteProjectMembers: () => true,
}))

const PRESENCE: Pick<GlobalPresence, 'user' | 'locations'>[] = [
  {
    user: {id: 'user-ada', displayName: 'Ada Lovelace'},
    locations: [
      {
        type: 'document',
        documentId: 'drafts.article-engines',
        lastActiveAt: '2026-08-21T12:00:00.000Z',
        path: ['title'],
      },
    ],
  },
  {
    user: {id: 'user-grace', displayName: 'Grace Hopper'},
    locations: [],
  },
]

// The navbar has no pane above it, so its menus measure `constrainSize`
// against the viewport in the studio. The wrapper's pane is only as tall as
// its content (one button) and would clamp the open menu to a few pixels.
function PresenceMenuHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <BoundaryElementProvider element={window.document.body}>
        <PresenceMenu />
      </BoundaryElementProvider>
    </TestWrapper>
  )
}

/**
 * Visual coverage for the navbar presence menu: the positive-tone status
 * button while someone else is present, the open menu with one row that links
 * to a document and one disabled row for a user outside any document, and the
 * invite footer below the divider.
 */
describe('PresenceMenu', () => {
  test('lists present users and the invite action in the open menu', async () => {
    const {settleChromaticEndState} = testHelpers()

    await render(<PresenceMenuHarness />)

    const button = page.getByRole('button', {name: 'Global presence'})
    await expect.element(button).toBeVisible()
    await userEvent.click(button)

    const menu = page.getByRole('menu')
    await expect.element(menu).toBeVisible()
    await expect.element(menu.getByText('Ada Lovelace')).toBeVisible()
    await expect.element(menu.getByText('Grace Hopper')).toBeVisible()
    await expect.element(menu.getByText('Invite members')).toBeVisible()
    // `toBeVisible` passes for a menu clamped to a few pixels by `constrainSize`.
    await expect.poll(() => menu.element().getBoundingClientRect().height).toBeGreaterThan(100)

    await settleChromaticEndState()
  })
})
