import {configure, takeSnapshot} from '@chromatic-com/vitest'
import {type CurrentUser} from '@sanity/types'
import {Card} from '@sanity/ui'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {COMMENT_REACTION_OPTIONS} from '../../../constants'
import {commentsUsEnglishLocaleBundle} from '../../../i18n'
import {type CommentReactionItem} from '../../../types'
import {CommentReactionsBar} from '../CommentReactionsBar'
import {CommentReactionsMenu} from '../CommentReactionsMenu'
import {CommentReactionsUsersTooltip} from '../CommentReactionsUsersTooltip'

// Matches the `/users/me` response of the mock client so reactions by this
// user render as "You" / selected.
const CURRENT_USER = {
  id: 'grrm',
  sanityUserId: 'grrm',
  name: 'George R.R. Martin',
  email: 'george@example.com',
  role: 'administrator',
  roles: [],
} as unknown as CurrentUser

const ADDED_AT = '2024-01-01T00:00:00.000Z'

// A fixed reaction set: two thumbs up (one by the current user), one heart by
// someone else, and one eyes reaction. The mock client does not resolve other
// user ids, so they render with the "Unknown user" fallback.
const REACTIONS: CommentReactionItem[] = [
  {_key: 'r1', shortName: ':+1:', userId: 'grrm', addedAt: ADDED_AT},
  {_key: 'r2', shortName: ':+1:', userId: 'user-b', addedAt: ADDED_AT},
  {_key: 'r3', shortName: ':heart:', userId: 'user-c', addedAt: ADDED_AT},
  {_key: 'r4', shortName: ':eyes:', userId: 'user-b', addedAt: ADDED_AT},
]

const noop = () => {}

function ReactionsBarHarness(props: {reactions?: CommentReactionItem[]; readOnly?: boolean}) {
  const {reactions = REACTIONS, readOnly} = props
  return (
    <TestWrapper schemaTypes={[]} i18nBundles={[commentsUsEnglishLocaleBundle]}>
      <Card padding={4} data-testid="reactions-bar">
        <CommentReactionsBar
          currentUser={CURRENT_USER}
          mode="default"
          onSelect={noop}
          reactions={reactions}
          readOnly={readOnly}
        />
      </Card>
    </TestWrapper>
  )
}

function ReactionsMenuHarness() {
  return (
    <TestWrapper schemaTypes={[]} i18nBundles={[commentsUsEnglishLocaleBundle]}>
      <Card padding={2} radius={3} shadow={2} style={{display: 'inline-block'}}>
        <CommentReactionsMenu onSelect={noop} options={COMMENT_REACTION_OPTIONS} />
      </Card>
    </TestWrapper>
  )
}

function UsersTooltipHarness() {
  return (
    <TestWrapper schemaTypes={[]} i18nBundles={[commentsUsEnglishLocaleBundle]}>
      <Card padding={4}>
        <CommentReactionsUsersTooltip
          currentUser={CURRENT_USER}
          reactionName=":heart:"
          userIds={['user-b', 'grrm', 'user-c']}
        >
          <Card border padding={2} radius={2} data-testid="tooltip-anchor">
            Hover me
          </Card>
        </CommentReactionsUsersTooltip>
      </Card>
    </TestWrapper>
  )
}

describe('CommentReactionsBar', () => {
  const {settleChromaticEndState} = testHelpers()

  it('renders grouped reactions with the current user selected', async () => {
    void render(<ReactionsBarHarness />)

    const bar = page.getByTestId('reactions-bar')
    await expect.element(bar.getByText('👍')).toBeVisible()
    await expect.element(bar.getByText('❤️')).toBeVisible()
    await expect.element(bar.getByText('👀')).toBeVisible()
    // The thumbs up group counts both reactions.
    await expect.element(bar.getByText('2', {exact: true})).toBeVisible()

    const buttons = bar.element().querySelectorAll('button')
    // three reaction groups + the add-reaction menu button
    expect(buttons).toHaveLength(4)
    expect(buttons[0].getAttribute('data-selected')).not.toBeNull()
    expect(buttons[1].getAttribute('data-selected')).toBeNull()

    await settleChromaticEndState()
  })

  it('renders the reactions as disabled when read only', async () => {
    void render(<ReactionsBarHarness readOnly />)

    const bar = page.getByTestId('reactions-bar')
    await expect.element(bar.getByText('👍')).toBeVisible()
    const buttons = bar.element().querySelectorAll('button')
    expect(Array.from(buttons).every((button) => button.disabled)).toBe(true)

    await settleChromaticEndState()
  })

  it('opens the reactions menu from the add-reaction button', async () => {
    // The auto snapshot could race the menu closing; archive while it is open.
    configure({disableAutoSnapshot: true})
    void render(<ReactionsBarHarness reactions={[]} />)

    // The add-reaction button is labelled by a tooltip only, so it has no
    // accessible name to query by; CommentReactionsMenuButton gives it this id.
    const bar = page.getByTestId('reactions-bar')
    await expect.element(bar).toBeVisible()
    const addReaction = bar.element().querySelector<HTMLButtonElement>('#reactions-menu-button')
    if (!addReaction) throw new Error('add-reaction button not rendered')
    await page.elementLocator(addReaction).click()

    const menu = page.getByRole('menu')
    await expect.element(menu).toBeVisible()
    await expect.element(page.getByRole('menuitem', {name: 'React with Thumbs up'})).toBeVisible()
    expect(menu.element().querySelectorAll('[role="menuitem"]')).toHaveLength(
      COMMENT_REACTION_OPTIONS.length,
    )

    await settleChromaticEndState()
    await expect.element(menu).toBeVisible()
    await takeSnapshot('reactions-menu-open')
  })
})

describe('CommentReactionsMenu', () => {
  const {settleChromaticEndState} = testHelpers()

  it('renders one labelled menu item per reaction option', async () => {
    void render(<ReactionsMenuHarness />)

    const menu = page.getByRole('menu')
    await expect.element(menu).toBeVisible()
    expect(menu.element().querySelectorAll('[role="menuitem"]')).toHaveLength(
      COMMENT_REACTION_OPTIONS.length,
    )
    await expect.element(page.getByRole('menuitem', {name: 'React with Heart'})).toBeVisible()

    await settleChromaticEndState()
  })
})

describe('CommentReactionsUsersTooltip', () => {
  it('lists who reacted, naming the current user "you"', async () => {
    // The end state of this test is the open tooltip; the pointer has to stay
    // on the anchor, so the parked-pointer auto snapshot is replaced by an
    // explicit one taken while the tooltip is showing.
    configure({disableAutoSnapshot: true})
    void render(<UsersTooltipHarness />)

    await userEvent.hover(page.getByTestId('tooltip-anchor'))

    await expect.element(page.getByText('reacted with')).toBeVisible()
    await expect.element(page.getByText(':heart:')).toBeVisible()
    await expect.element(page.getByText('you', {exact: true})).toBeVisible()
    expect(page.getByText('Unknown user').elements()).toHaveLength(2)

    await takeSnapshot('users-tooltip-open')
  })
})
