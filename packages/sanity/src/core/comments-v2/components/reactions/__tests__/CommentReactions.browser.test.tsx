import {configure} from '@chromatic-com/vitest'
import {type CurrentUser} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {COMMENT_REACTION_OPTIONS} from '../../../constants'
import {commentsUsEnglishLocaleBundle} from '../../../i18n'
import {type CommentReactionItem, type CommentReactionOption} from '../../../types'
import {CommentReactionsBar} from '../CommentReactionsBar'
import {CommentReactionsMenu} from '../CommentReactionsMenu'
import {CommentReactionsUsersTooltip} from '../CommentReactionsUsersTooltip'

const SCHEMA_TYPES: [] = []

// `sanityUserId` matches the mock workspace's current user (`doug`), whose
// display name the user store resolves without a request. Any other user id is
// unknown to the mock client and renders the "Unknown user" fallback.
const currentUser: CurrentUser = {
  id: 'doug',
  sanityUserId: 'doug',
  name: 'Doug',
  email: 'doug@sanity.io',
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  role: 'administrator',
  roles: [],
}

const REACTIONS: CommentReactionItem[] = [
  {_key: 'r1', shortName: ':+1:', userId: 'doug', addedAt: '2026-01-01T00:00:00.000Z'},
  {_key: 'r2', shortName: ':+1:', userId: 'someone-else', addedAt: '2026-01-01T00:01:00.000Z'},
  {_key: 'r3', shortName: ':heart:', userId: 'someone-else', addedAt: '2026-01-01T00:02:00.000Z'},
]

function ReactionsBarHarness({
  onSelect = noop,
  readOnly,
}: {
  onSelect?: (option: CommentReactionOption) => void
  readOnly?: boolean
}) {
  return (
    <TestWrapper i18nBundles={[commentsUsEnglishLocaleBundle]} schemaTypes={SCHEMA_TYPES}>
      <Card padding={4} style={{maxWidth: 320}}>
        <CommentReactionsBar
          currentUser={currentUser}
          mode="default"
          onSelect={onSelect}
          reactions={REACTIONS}
          readOnly={readOnly}
        />
      </Card>
    </TestWrapper>
  )
}

/** The emoji grid and the users tooltip on their own, outside the bar's popover. */
function ReactionsPartsHarness() {
  return (
    <TestWrapper i18nBundles={[commentsUsEnglishLocaleBundle]} schemaTypes={SCHEMA_TYPES}>
      <Card padding={4} style={{maxWidth: 320}}>
        <Text muted size={1} weight="medium">
          emoji menu
        </Text>
        <Card padding={1} radius={3} border style={{maxWidth: 240}}>
          <CommentReactionsMenu onSelect={noop} options={COMMENT_REACTION_OPTIONS} />
        </Card>
      </Card>
      <Card padding={4} style={{maxWidth: 320}}>
        <Text muted size={1} weight="medium">
          users tooltip
        </Text>
        <CommentReactionsUsersTooltip
          currentUser={currentUser}
          reactionName=":heart:"
          userIds={['doug', 'someone-else']}
        >
          <button type="button" data-testid="reaction-chip">
            who reacted
          </button>
        </CommentReactionsUsersTooltip>
      </Card>
    </TestWrapper>
  )
}

const addReactionButton = () =>
  testHelpers().findBySelector({element: () => document.body}, '#reactions-menu-button')

describe('CommentReactionsBar', () => {
  it('renders grouped reactions with the current user highlighted', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ReactionsBarHarness />)

    // 👍 by two users (one of them the current user), ❤️ by one.
    await expect.element(page.getByText('2', {exact: true})).toBeVisible()
    await expect.element(page.getByText('1', {exact: true})).toBeVisible()
    const $addReaction = await addReactionButton()
    await expect.element($addReaction).toBeEnabled()
    await settleChromaticEndState()
  })

  it('opens the emoji menu from the add-reaction button', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ReactionsBarHarness />)

    const $addReaction = await addReactionButton()
    await userEvent.click($addReaction)

    const $menu = page.getByRole('menu')
    await expect.element($menu).toBeVisible()
    await expect.element($menu.getByRole('menuitem', {name: 'React with Rocket'})).toBeVisible()
    await expect.element($addReaction).toHaveAttribute('aria-expanded', 'true')
    await settleChromaticEndState()
    await expect.element($menu).toBeVisible()
  })

  it('reports the picked reaction and closes the menu', async () => {
    // Ends back on the plain bar, which the first test already archives.
    configure({disableAutoSnapshot: true})
    const onSelect = vi.fn()
    void render(<ReactionsBarHarness onSelect={onSelect} />)

    await userEvent.click(await addReactionButton())
    const $menu = page.getByRole('menu')
    await expect.element($menu).toBeVisible()
    await userEvent.click($menu.getByRole('menuitem', {name: 'React with Eyes'}))

    await expect.poll(() => onSelect.mock.calls.length).toBe(1)
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({shortName: ':eyes:'}))
    await expect.element($menu).not.toBeInTheDocument()
  })

  it('disables reacting when read-only', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ReactionsBarHarness readOnly />)

    const $addReaction = await addReactionButton()
    await expect.element($addReaction).toBeDisabled()
    await expect.element(page.getByText('2', {exact: true})).toBeVisible()
    await settleChromaticEndState()
  })
})

describe('CommentReactionsMenu and CommentReactionsUsersTooltip', () => {
  it('renders the emoji grid and lists who reacted on hover', async () => {
    void render(<ReactionsPartsHarness />)

    const $menu = page.getByRole('menu')
    await expect.element($menu).toBeVisible()
    await expect.element($menu.getByRole('menuitem', {name: 'React with Heart'})).toBeVisible()

    // The tooltip names the current user as "You" and falls back to
    // "Unknown user" for an id the mock client cannot resolve.
    await userEvent.hover(page.getByTestId('reaction-chip'))
    await expect.element(page.getByText('You', {exact: true})).toBeVisible()
    await expect.element(page.getByText('Unknown user', {exact: true})).toBeVisible()
    await expect.element(page.getByText('reacted with', {exact: true})).toBeVisible()
    await expect.element(page.getByText(':heart:', {exact: true})).toBeVisible()
  })
})
