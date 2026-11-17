import {of} from 'rxjs'
import {beforeEach, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import type * as IsUsingLegacyHttpModule from '../../../network/isUsingLegacyHttp'
import {useNetworkProtocolCheck} from '../useNetworkProtocolCheck'

// The real probe pings the API and reads the browser's Resource Timing entry
// for the request, which no mock client can answer. The warning toast is what
// this test archives, so the probe is replaced with a settled legacy answer.
vi.mock('../../../network/isUsingLegacyHttp', async (importOriginal) => ({
  ...(await importOriginal<typeof IsUsingLegacyHttpModule>()),
  isUsingLegacyHttp: () => of(true),
}))

const {settleChromaticEndState} = testHelpers()

beforeEach(() => {
  sessionStorage.removeItem('sanity-studio.network.check.snooze')
})

function NetworkProtocolCheckHarness() {
  useNetworkProtocolCheck()
  return <div data-testid="studio-content">Studio content</div>
}

it('shows the slow-protocol warning toast with its help link and snooze action', async () => {
  await render(
    <TestWrapper schemaTypes={[]}>
      <NetworkProtocolCheckHarness />
    </TestWrapper>,
  )

  // `useConditionalToast` pushes the toast on its next one-second clock tick
  // after the probe answers, so the toast appears about a second after mount.
  await expect.element(page.getByText("You've got your brakes on")).toBeVisible()
  await expect
    .element(page.getByText('Your browser is using an outdated HTTP protocol'))
    .toBeVisible()
  await expect
    .element(page.getByRole('link', {name: 'Learn more'}))
    .toHaveAttribute('href', expect.stringContaining('http1-performance-issues'))
  await expect
    .element(page.getByRole('button', {name: "Don't show again for this session"}))
    .toBeEnabled()

  await settleChromaticEndState()
})
