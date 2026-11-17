import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import noop from 'lodash-es/noop.js'
import {expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {FallbackErrorScreen} from '../FallbackErrorScreen'

const theme = buildTheme()
const {settleChromaticEndState} = testHelpers()

// Stacks carry file URLs and line numbers of whatever bundled the test, so the
// fixtures pin their own stack text instead of the one the runtime generates.
function fixtureError(message: string, extra?: Record<string, unknown>): Error {
  const error = Object.assign(new Error(message), extra)
  error.stack = `Error: ${message}\n    at renderStudio (studio.js:12:3)\n    at mount (main.js:4:1)`
  return error
}

// Browser tests run with NODE_ENV=test, where `isDev` is true, so the critical
// details card and the request-error "Developer tip" render here. The
// Storybook/Chromatic build is a production build and never shows them.
function FallbackErrorScreenHarness({error}: {error: Error}) {
  return (
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <LayerProvider>
          <div style={{height: 900}}>
            <FallbackErrorScreen error={error} eventId="evt_fixture_01" onReset={noop} />
          </div>
        </LayerProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

it('renders the heading, the dev details card and the error actions', async () => {
  await render(<FallbackErrorScreenHarness error={fixtureError('Cannot read schema type')} />)

  const screen = page.getByTestId('studio-error-screen')
  await expect.element(screen.getByText('An error occurred', {exact: true})).toBeVisible()
  await expect.element(screen.getByText('Cannot read schema type', {exact: true})).toBeVisible()
  await expect.element(screen.getByText('Event ID: evt_fixture_01')).toBeVisible()
  await expect.element(screen.getByText('Developer tip')).not.toBeInTheDocument()
  await expect.element(screen.getByRole('button', {name: 'Retry'})).toBeEnabled()
  await expect.element(screen.getByRole('button', {name: 'Copy error details'})).toBeEnabled()

  await settleChromaticEndState()
})

it('adds the developer tip when a recoverable request error reached the boundary', async () => {
  await render(
    <FallbackErrorScreenHarness error={fixtureError('Failed to fetch', {isNetworkError: true})} />,
  )

  const screen = page.getByTestId('studio-error-screen')
  await expect.element(screen.getByText('Developer tip')).toBeVisible()
  await expect.element(screen.getByText('This tip is only shown in development.')).toBeVisible()
  await expect.element(screen.getByText('useStudioErrorHandler()')).toBeVisible()

  await settleChromaticEndState()
})
