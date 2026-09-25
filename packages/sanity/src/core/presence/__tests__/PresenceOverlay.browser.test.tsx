import {
  defineArrayMember,
  defineField,
  defineType,
  type Path,
  type SanityDocument,
} from '@sanity/types'
import {type FormNodePresence} from 'sanity'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../test/browser/TestForm'
import {testHelpers} from '../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {PresenceOverlay} from '../overlay/PresenceOverlay'

/**
 * The presence overlay as the document pane uses it: fields report their presence, the overlay
 * draws the avatars next to the field while it is in view and docks them at the top or bottom
 * edge of the pane (with an arrow pointing towards the field) once the field is scrolled out.
 *
 * Avatars are selected by geometry, never by counting `[title]` elements globally: the field
 * tooltips keep an avatar per user mounted while closed.
 */

const FIELD_COUNT = 30

const schemaTypes = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      ...Array.from({length: FIELD_COUNT}, (_, i) =>
        defineField({type: 'string', name: `field${i}`, title: `Field ${i}`}),
      ),
      defineField({
        type: 'object',
        name: 'author',
        title: 'Author',
        fields: [
          defineField({type: 'string', name: 'name', title: 'Name'}),
          defineField({type: 'string', name: 'bio', title: 'Bio'}),
        ],
      }),
      defineField({
        type: 'array',
        name: 'items',
        title: 'Items',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'item',
            fields: [defineField({type: 'string', name: 'name', title: 'Name'})],
          }),
        ],
      }),
    ],
  }),
]

const DOCUMENT: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: new Date().toISOString(),
  _updatedAt: new Date().toISOString(),
  _rev: '123',
  author: {name: 'Nancy', bio: 'Writes things'},
  items: [
    {_type: 'item', _key: 'a', name: 'First'},
    {_type: 'item', _key: 'b', name: 'Second'},
  ],
}

function presence(
  userId: string,
  path: Path,
  overrides: Partial<Omit<FormNodePresence, 'user' | 'path'>> = {},
): FormNodePresence {
  return {
    user: {id: userId, displayName: `User ${userId}`},
    path,
    sessionId: `session-${userId}`,
    lastActiveAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const tenUsersIn = (path: Path) =>
  Array.from({length: 10}, (_, i) =>
    presence(`u${i}`, path, {lastActiveAt: `2026-01-01T00:00:0${i}.000Z`}),
  )

function Harness(props: {presence: FormNodePresence[]}) {
  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <div
        data-testid="presence-test-pane"
        style={{height: '100vh', overflow: 'auto', position: 'relative'}}
      >
        <PresenceOverlay>
          <TestForm document={DOCUMENT} presence={props.presence} />
        </PresenceOverlay>
      </div>
    </TestWrapper>
  )
}

// ---- helpers -----------------------------------------------------------------------------------

const pane = () => document.querySelector<HTMLElement>('[data-testid="presence-test-pane"]')!
const field = (name: string) =>
  document.querySelector<HTMLElement>(`[data-testid="field-${name}"]`)!

function isWithin(rect: DOMRect, bounds: DOMRect) {
  return (
    rect.height > 0 &&
    rect.top >= bounds.top - 1 &&
    rect.bottom <= bounds.bottom + 1 &&
    rect.left >= bounds.left - 1 &&
    rect.right <= bounds.right + 1
  )
}

function intersects(rect: DOMRect, bounds: DOMRect) {
  return rect.height > 0 && rect.bottom > bounds.top && rect.top < bounds.bottom
}

/** All avatars currently visible within the pane, optionally only those of one user */
function visibleAvatars(displayName?: string) {
  const bounds = pane().getBoundingClientRect()
  const selector = displayName ? `[data-ui="Avatar"][title="${displayName}"]` : '[data-ui="Avatar"]'
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((avatar) =>
    intersects(avatar.getBoundingClientRect(), bounds),
  )
}

/** Avatars docked at the top or bottom edge of the pane */
const dockAvatars = (dock: 'top' | 'bottom') =>
  Array.from(document.querySelectorAll<HTMLElement>(`[data-dock="${dock}"] [data-ui="Avatar"]`))

const dockCounter = (dock: 'top' | 'bottom') =>
  document.querySelector(`[data-dock="${dock}"] [data-ui="AvatarCounter"]`)

/** Avatars drawn over a field's own box (its header), i.e. not docked */
function fieldAvatars(name: string) {
  const bounds = field(name).getBoundingClientRect()
  return visibleAvatars().filter(
    (avatar) => !avatar.closest('[data-dock]') && isWithin(avatar.getBoundingClientRect(), bounds),
  )
}

function fieldCounter(name: string) {
  const bounds = field(name).getBoundingClientRect()
  return Array.from(document.querySelectorAll<HTMLElement>('[data-ui="AvatarCounter"]')).find(
    (counter) =>
      !counter.closest('[data-dock]') && isWithin(counter.getBoundingClientRect(), bounds),
  )
}

/**
 * The arrow of an avatar. `@sanity/ui`'s Avatar starts out with `animateArrowFrom` and moves to
 * its real position one animation frame after mounting, so assertions on arrows must poll.
 */
const arrowOf = (avatar: Element) => avatar.getAttribute('data-arrow-position')
const arrowsOf = (avatars: Element[]) => avatars.map(arrowOf)

/** Scrolls the pane so the field sits at the given place of the viewport */
function scrollFieldTo(name: string, block: 'start' | 'center' | 'end') {
  field(name).scrollIntoView({block})
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 100))

const titles = (avatars: Element[]) =>
  avatars.map((a) => a.getAttribute('title') ?? '').toSorted((a, b) => a.localeCompare(b))

async function settlePresenceSnapshot() {
  const {settleChromaticEndState, waitForPresenceGeometry} = testHelpers()
  await settleChromaticEndState()
  await waitForPresenceGeometry()
}

// ---- tests -------------------------------------------------------------------------------------

describe('PresenceOverlay', () => {
  it('shows nothing when no one is in the document', async () => {
    void render(<Harness presence={[]} />)
    await expect.element(page.getByTestId('field-field0')).toBeVisible()
    await settle()

    expect(visibleAvatars()).toHaveLength(0)
    expect(dockAvatars('top')).toHaveLength(0)
    expect(dockAvatars('bottom')).toHaveLength(0)

    // Scrolling around does not conjure anything up either
    pane().scrollTop = pane().scrollHeight
    await settle()
    expect(visibleAvatars()).toHaveLength(0)
    await settlePresenceSnapshot()
  })

  it('stacks 10 users in one field into 3 avatars and a counter of 7', async () => {
    void render(<Harness presence={tenUsersIn(['field2'])} />)

    await expect.poll(() => fieldAvatars('field2')).toHaveLength(3)
    expect(fieldCounter('field2')).toMatchTextContent('7')
    expect(visibleAvatars()).toHaveLength(3)
    expect(dockAvatars('top')).toHaveLength(0)
    expect(dockAvatars('bottom')).toHaveLength(0)
    // The most recently active users are the visible ones
    expect(titles(fieldAvatars('field2'))).toEqual(['User u7', 'User u8', 'User u9'])
    await settlePresenceSnapshot()
  })

  it('docks 10 users in a field below the fold as 2 avatars and a counter of 8, and hands them back to the field header when it scrolls into view', async () => {
    void render(<Harness presence={tenUsersIn(['field25'])} />)

    await expect.poll(() => dockAvatars('bottom')).toHaveLength(2)
    expect(dockCounter('bottom')).toMatchTextContent('8')
    await expect.poll(() => arrowsOf(dockAvatars('bottom'))).toEqual(['bottom', 'bottom'])
    expect(dockAvatars('top')).toHaveLength(0)
    expect(visibleAvatars()).toHaveLength(2)

    // Scrolled into view, the field header takes over
    scrollFieldTo('field25', 'center')
    await expect.poll(() => fieldAvatars('field25')).toHaveLength(3)
    expect(fieldCounter('field25')).toMatchTextContent('7')
    expect(dockAvatars('bottom')).toHaveLength(0)
    expect(visibleAvatars()).toHaveLength(3)
    await settlePresenceSnapshot()
  })

  it('shows 10 users in 10 different fields once per field, and stacks them in a dock once scrolled out', async () => {
    const users = Array.from({length: 10}, (_, i) => presence(`u${i}`, [`field${i}`]))
    // Tall enough for fields 0 to 9 (about 100px each) to all be in view
    await page.viewport(1280, 1400)
    void render(<Harness presence={users} />)

    await expect.poll(() => visibleAvatars()).toHaveLength(10)
    for (let i = 0; i < 10; i++) {
      expect(titles(fieldAvatars(`field${i}`))).toEqual([`User u${i}`])
    }
    // A field within SLIDE_RIGHT_THRESHOLD_TOP of the pane edge already points its arrow towards
    // the edge while still drawn at the field; the others point nowhere in particular.
    await expect.poll(() => arrowsOf(fieldAvatars('field0'))).toEqual(['top'])
    await expect.poll(() => arrowsOf(fieldAvatars('field5'))).toEqual(['inside'])
    expect(dockAvatars('top')).toHaveLength(0)
    expect(dockAvatars('bottom')).toHaveLength(0)

    // All of them above the viewport: the top dock stacks them like a single field would
    pane().scrollTop = pane().scrollHeight
    await expect.poll(() => dockAvatars('top')).toHaveLength(2)
    expect(dockCounter('top')).toMatchTextContent('8')
    await expect.poll(() => arrowsOf(dockAvatars('top'))).toEqual(['top', 'top'])
    expect(dockAvatars('bottom')).toHaveLength(0)
    expect(visibleAvatars()).toHaveLength(2)
    await settlePresenceSnapshot()
  })

  it('docks users above the view at the top, users below it at the bottom, and keeps the one in view at its field', async () => {
    void render(
      <Harness
        presence={[
          presence('above', ['field0']),
          presence('inside', ['field14']),
          presence('below', ['field29']),
        ]}
      />,
    )
    await expect.element(page.getByTestId('field-field14')).toBeVisible()

    scrollFieldTo('field14', 'center')

    await expect.poll(() => titles(dockAvatars('top'))).toEqual(['User above'])
    await expect.poll(() => arrowsOf(dockAvatars('top'))).toEqual(['top'])

    await expect.poll(() => titles(dockAvatars('bottom'))).toEqual(['User below'])
    await expect.poll(() => arrowsOf(dockAvatars('bottom'))).toEqual(['bottom'])

    expect(titles(fieldAvatars('field14'))).toEqual(['User inside'])
    await expect.poll(() => arrowsOf(fieldAvatars('field14'))).toEqual(['inside'])

    // Every user is visible exactly once
    expect(titles(visibleAvatars())).toEqual(['User above', 'User below', 'User inside'])
    await settlePresenceSnapshot()
  })

  it('never shows a user twice while a field scrolls from the middle of the pane into the top dock and back', async () => {
    void render(<Harness presence={[presence('mover', ['field15'])]} />)
    await expect.element(page.getByTestId('field-field15')).toBeVisible()

    scrollFieldTo('field15', 'center')
    await expect.poll(() => fieldAvatars('field15')).toHaveLength(1)
    const startScrollTop = pane().scrollTop
    const fieldTop =
      field('field15').getBoundingClientRect().top - pane().getBoundingClientRect().top

    // Scroll the field up past the top edge in small steps
    const seenArrows = new Set<string | null>()
    for (let offset = 0; offset <= fieldTop + 60; offset += 12) {
      pane().scrollTop = startScrollTop + offset
      await settle()
      const avatars = visibleAvatars('User mover')
      expect(avatars.length, `at ${offset}px`).toBeLessThanOrEqual(1)
      avatars.forEach((avatar) => seenArrows.add(arrowOf(avatar)))
    }

    // It ends up docked at the top, and on the way the arrow flipped towards the field
    await expect.poll(() => titles(dockAvatars('top'))).toEqual(['User mover'])
    expect(visibleAvatars('User mover')).toHaveLength(1)
    expect(seenArrows.has('inside')).toBe(true)
    expect(seenArrows.has('top')).toBe(true)

    // And back down again
    for (let offset = fieldTop + 60; offset >= 0; offset -= 12) {
      pane().scrollTop = startScrollTop + offset
      await settle()
      expect(visibleAvatars('User mover').length, `at ${offset}px`).toBeLessThanOrEqual(1)
    }
    await expect.poll(() => fieldAvatars('field15')).toHaveLength(1)
    expect(dockAvatars('top')).toHaveLength(0)
    await expect.poll(() => arrowsOf(fieldAvatars('field15'))).toEqual(['inside'])
    await settlePresenceSnapshot()
  })

  it('moves the field avatar out of the way of the field actions on hover, and back', async () => {
    void render(<Harness presence={[presence('u1', ['field2'])]} />)
    await expect.poll(() => fieldAvatars('field2')).toHaveLength(1)
    const restingLeft = fieldAvatars('field2')[0].getBoundingClientRect().left

    // Hovering the field reveals the actions card at the header's right edge; the avatar's
    // placeholder shifts left to make room, and the drawn avatar has to follow it.
    await page.getByTestId('field-field2').hover()
    const actions = page.getByTestId('field-actions-menu-field2')
    await expect.element(actions).toBeVisible()
    const actionsRect = actions.element().getBoundingClientRect()

    await expect
      .poll(() => fieldAvatars('field2')[0]?.getBoundingClientRect().right)
      .toBeLessThanOrEqual(actionsRect.left)
    expect(fieldAvatars('field2')[0].getBoundingClientRect().left).toBeLessThan(restingLeft)

    // Leaving the field hides the actions again and the avatar returns to its resting place.
    // Positions come from summed `offsetLeft`s and are re-measured after the round trip, which
    // lands a sub-pixel off in Firefox and WebKit; the point is that it is not left sitting a
    // whole actions card to the left, so allow a pixel.
    await page.getByTestId('field-field5').hover()
    await expect
      .poll(() =>
        Math.abs((fieldAvatars('field2')[0]?.getBoundingClientRect().left ?? -1) - restingLeft),
      )
      .toBeLessThanOrEqual(1)
    await settlePresenceSnapshot()
  })

  it('shows a user with several sessions once, in the field and in the dock', async () => {
    void render(
      <Harness
        presence={[
          presence('twice', ['field3'], {sessionId: 'session-a'}),
          presence('twice', ['field3'], {sessionId: 'session-b'}),
          presence('twice', ['field4'], {sessionId: 'session-c'}),
        ]}
      />,
    )

    // One avatar per field even though the user has two sessions in field3
    await expect.poll(() => titles(fieldAvatars('field3'))).toEqual(['User twice'])
    expect(titles(fieldAvatars('field4'))).toEqual(['User twice'])
    expect(visibleAvatars('User twice')).toHaveLength(2)

    // Both fields above the view: the dock shows the user once
    pane().scrollTop = pane().scrollHeight
    await expect.poll(() => titles(dockAvatars('top'))).toEqual(['User twice'])
    expect(visibleAvatars('User twice')).toHaveLength(1)
    await settlePresenceSnapshot()
  })

  it('shows nested field presence on the nested header, array item presence on the item preview, and document-level presence nowhere', async () => {
    void render(
      <Harness
        presence={[
          presence('nested', ['author', 'name']),
          presence('item', ['items', {_key: 'b'}, 'name']),
          presence('root', []),
        ]}
      />,
    )
    await expect.element(page.getByTestId('field-field0')).toBeVisible()

    scrollFieldTo('author', 'start')
    await expect.poll(() => titles(fieldAvatars('author.name'))).toEqual(['User nested'])
    // ...and only there: the parent object's box contains no other avatar
    expect(titles(fieldAvatars('author'))).toEqual(['User nested'])

    // The array item is collapsed, so its preview row carries the presence of its fields
    await expect.poll(() => titles(fieldAvatars('items'))).toEqual(['User item'])
    const [itemAvatar] = fieldAvatars('items')
    const secondItemRow = page.getByText('Second').element().getBoundingClientRect()
    const avatarRect = itemAvatar.getBoundingClientRect()
    expect(avatarRect.top).toBeLessThan(secondItemRow.bottom)
    expect(avatarRect.bottom).toBeGreaterThan(secondItemRow.top)

    // Document-level presence is not a field
    expect(visibleAvatars('User root')).toHaveLength(0)
    expect(dockAvatars('top')).toHaveLength(0)
    expect(dockAvatars('bottom')).toHaveLength(0)
    await settlePresenceSnapshot()
  })

  it('follows users as they leave, arrive and move, whether in view or docked', async () => {
    const screen = await render(
      <Harness presence={[presence('alice', ['field1']), presence('bob', ['field28'])]} />,
    )

    await expect.poll(() => titles(fieldAvatars('field1'))).toEqual(['User alice'])
    await expect.poll(() => titles(dockAvatars('bottom'))).toEqual(['User bob'])

    // Bob moves into view and Alice moves below the fold
    await screen.rerender(
      <Harness presence={[presence('alice', ['field28']), presence('bob', ['field2'])]} />,
    )
    await expect.poll(() => titles(fieldAvatars('field2'))).toEqual(['User bob'])
    await expect.poll(() => titles(dockAvatars('bottom'))).toEqual(['User alice'])
    expect(fieldAvatars('field1')).toHaveLength(0)
    expect(visibleAvatars()).toHaveLength(2)

    // Carol joins a docked field: the dock grows
    await screen.rerender(
      <Harness
        presence={[
          presence('alice', ['field28']),
          presence('bob', ['field2']),
          presence('carol', ['field29']),
        ]}
      />,
    )
    await expect.poll(() => titles(dockAvatars('bottom'))).toEqual(['User alice', 'User carol'])

    // Everyone leaves
    await screen.rerender(<Harness presence={[]} />)
    await expect.poll(() => visibleAvatars()).toHaveLength(0)
    expect(dockAvatars('bottom')).toHaveLength(0)
    await settlePresenceSnapshot()
  })
})
