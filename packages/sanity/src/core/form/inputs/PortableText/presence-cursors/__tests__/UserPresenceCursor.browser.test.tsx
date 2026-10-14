import {configure, takeSnapshot} from '@chromatic-com/vitest'
import {Card, Text} from '@sanity/ui'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable, testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type FormNodePresence} from '../../../../../presence/types'
import {UserPresenceCursor} from '../UserPresenceCursor'

const SPAN_PATH = [{_key: 'a'}, 'children', {_key: 'a1'}]

function presenceFor(id: string, displayName: string, offset: number): FormNodePresence {
  return {
    path: ['body', 'text'],
    lastActiveAt: '2024-01-01T00:00:00.000Z',
    sessionId: `session-${id}`,
    selection: {
      anchor: {offset, path: SPAN_PATH},
      focus: {offset, path: SPAN_PATH},
      backward: false,
    },
    user: {id, displayName},
  }
}

const USER_A = presenceFor('user-A', 'User A', 7)
const USER_B = presenceFor('user-B', 'User B', 15)

/**
 * Two remote cursors inline in a paragraph, the way `Compositor` renders them
 * between the spans of a text block. Rendered without the editor so the
 * cursor line, its dot and the hover name label are the only moving parts.
 */
function UserPresenceCursorHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={5} style={{maxWidth: 480}}>
        <Text>
          Hello, <UserPresenceCursor presence={USER_A} />
          this is <UserPresenceCursor presence={USER_B} />
          some text in the editor.
        </Text>
      </Card>
    </TestWrapper>
  )
}

/** The cursor dot: the only part of the cursor that receives pointer events. */
function getCursorDot(displayName: string): HTMLElement {
  const cursor = document.querySelector(
    `[data-testid="presence-cursor-${displayName.split(' ').join('-')}"]`,
  )
  const dot = cursor?.lastElementChild
  if (!(dot instanceof HTMLElement)) throw new Error(`no cursor dot for ${displayName}`)
  return dot
}

describe('UserPresenceCursor', () => {
  it('shows the user name while the cursor dot is hovered', async () => {
    // The label animates in and out; archive it explicitly while shown and
    // again once the two bare cursors are the resting state.
    configure({disableAutoSnapshot: true})
    const {settleChromaticEndState} = testHelpers()
    void render(<UserPresenceCursorHarness />)

    const $cursorA = page.getByTestId('presence-cursor-User-A')
    const $cursorB = page.getByTestId('presence-cursor-User-B')
    await expect.element($cursorA).toBeVisible()
    await expect.element($cursorB).toBeVisible()
    expect($cursorA.element().textContent).toBe('')

    await page.elementLocator(getCursorDot('User A')).hover()
    await expect.element($cursorA.getByText('User A')).toBeVisible()
    expect($cursorB.element().textContent).toBe('')
    // Wait for the label's spring transition to come to rest.
    const labelRect = () => {
      const cursor = $cursorA.element()
      // The label mounts ahead of the dot while hovered.
      const label = cursor.childElementCount === 2 ? cursor.firstElementChild : null
      if (!(label instanceof HTMLElement)) return ''
      const {width, height} = label.getBoundingClientRect()
      return `${width.toFixed(1)}x${height.toFixed(1)}:${getComputedStyle(label).opacity}`
    }
    expect(await expectStable(labelRect)).toMatch(/:1$/)
    await takeSnapshot('name-label-shown')

    await settleChromaticEndState()
    await expect.poll(() => $cursorA.element().textContent, {timeout: 5_000}).toBe('')
    await expect.element($cursorA).toBeVisible()
    await expect.element($cursorB).toBeVisible()
    await takeSnapshot('bare-cursors')
  })
})
