import {configure} from '@chromatic-com/vitest'
import {startTransition, useState, ViewTransition} from 'react'
import {afterEach, beforeEach, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, server, userEvent} from 'vitest/browser'

import {ColorSchemeProvider} from '../../../studio/colorScheme'
import {UserColorManagerProvider} from '../../../user-color/provider'
import {UserAvatar} from '../UserAvatar'

// The test ends on an avatar whose image never loads
configure({disableAutoSnapshot: true})

const NEVER_LOADING_IMAGE = 'https://avatars.invalid/never-loads.png'

beforeEach(() => server.commands.holdRequests(NEVER_LOADING_IMAGE))
afterEach(() => server.commands.releaseRequests(NEVER_LOADING_IMAGE))

function TransitionHarness() {
  const [visible, setVisible] = useState(false)

  return (
    <ColorSchemeProvider scheme="light">
      <UserColorManagerProvider>
        <button type="button" onClick={() => startTransition(() => setVisible(true))}>
          Show
        </button>
        <ViewTransition>
          <div data-testid="content">
            {visible && (
              <>
                <span>Sibling content</span>
                <UserAvatar
                  user={{id: 'pAda', displayName: 'Ada Lovelace', imageUrl: NEVER_LOADING_IMAGE}}
                />
              </>
            )}
          </div>
        </ViewTransition>
      </UserColorManagerProvider>
    </ColorSchemeProvider>
  )
}

it('commits the surrounding content with the avatar skeleton while the image loads', async () => {
  await render(<TransitionHarness />)
  const content = page.getByTestId('content').element()
  const skeletonWithSibling = new Promise<boolean>((resolve) => {
    const observer = new MutationObserver(() => {
      if (content.textContent?.includes('Sibling content')) {
        observer.disconnect()
        resolve(content.querySelector('[data-ui="Skeleton"]') !== null)
      }
    })
    observer.observe(content, {childList: true, subtree: true})
  })

  await userEvent.click(page.getByRole('button', {name: 'Show'}))

  // Without a boundary of its own, the image holds up the whole transition until it loads or
  // React's image timeout passes, and the sibling arrives together with the avatar
  expect(await skeletonWithSibling).toBe(true)
})
