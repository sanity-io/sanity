import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {afterEach, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {ImportErrorScreen} from '../ImportErrorScreen'

const theme = buildTheme()
const {settleChromaticEndState} = testHelpers()

afterEach(() => {
  vi.useRealTimers()
})

// Stacks carry file URLs and line numbers of whatever bundled the test, so the
// fixture pins its own stack text instead of the one the runtime generates.
function fixtureError(): Error {
  const error = new Error('Failed to fetch dynamically imported module: /static/tool-abc123.js')
  error.stack = `TypeError: ${error.message}\n    at lazy (studio.js:12:3)\n    at mount (main.js:4:1)`
  return error
}

// Browser tests run with NODE_ENV=test, where `isDev` is true, so the critical
// details card renders here. The Storybook/Chromatic build is a production
// build and never shows it.
function ImportErrorScreenHarness({autoReload}: {autoReload?: boolean}) {
  return (
    <ThemeProvider theme={theme}>
      <div style={{height: 900}}>
        <ImportErrorScreen
          error={fixtureError()}
          eventId="evt_fixture_02"
          autoReload={autoReload}
        />
      </div>
    </ThemeProvider>
  )
}

it('renders the import error with the dev details card and a plain reload button', async () => {
  await render(<ImportErrorScreenHarness />)

  const screen = page.getByTestId('studio-error-screen')
  await expect.element(screen.getByText('Import error', {exact: true})).toBeVisible()
  await expect.element(screen.getByText('An error occurred during dynamic import.')).toBeVisible()
  await expect.element(screen.getByText('Event ID: evt_fixture_02')).toBeVisible()
  await expect.element(screen.getByText('Reloading')).not.toBeInTheDocument()
  await expect.element(screen.getByRole('button', {name: 'Reload', exact: true})).toBeEnabled()

  await settleChromaticEndState()
})

it('shows the auto-reload countdown, frozen at its first value', async () => {
  // The countdown is an rxjs `timer(0, 1000)` subscribed on commit. Mount it
  // while interval timers are faked so that it never ticks; restoring real
  // timers afterwards orphans the fake interval instead of resuming it, which
  // keeps the copy at "Reloading in 5s…" and, more importantly, keeps the
  // screen from calling `window.location.reload()` on the test page.
  vi.useFakeTimers({toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']})
  try {
    await render(<ImportErrorScreenHarness autoReload />)
  } finally {
    vi.useRealTimers()
  }

  const screen = page.getByTestId('studio-error-screen')
  await expect.element(screen.getByText('Reloading in 5s…')).toBeVisible()
  await expect.element(screen.getByRole('button', {name: 'Reload now'})).toBeEnabled()

  await settleChromaticEndState()
  // Still frozen after the settle waits: the orphaned interval never fired.
  await expect.element(screen.getByText('Reloading in 5s…')).toBeVisible()
})
