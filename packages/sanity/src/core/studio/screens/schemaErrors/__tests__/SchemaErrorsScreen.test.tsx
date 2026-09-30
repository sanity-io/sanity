import {type Schema} from '@sanity/types'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {act, render, screen, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type SchemaErrorContext} from '../../../../config/SchemaError'
import {SchemaErrorsScreen} from '../SchemaErrorsScreen'

const theme = buildTheme()

const SCHEMA = {
  name: 'test',
  _validation: [
    {
      path: [{kind: 'type', type: 'document', name: 'mediaGalleryItem'}],
      problems: [{severity: 'error', message: 'Unknown type: article.'}],
    },
  ],
} as unknown as Schema

const CONTEXT: SchemaErrorContext = {
  workspaceName: 'broken',
  projectId: 'riot',
  dataset: 'live',
}

const writeText = vi.fn(() => Promise.resolve())

/**
 * `@sanity/ui`'s `Code` lazy-loads refractor behind its own Suspense boundary,
 * so the initial render has to settle inside `act` or the resolution lands
 * outside it.
 */
async function renderScreen(context?: SchemaErrorContext): Promise<void> {
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- see doc comment
  await act(async () => {
    render(
      <ThemeProvider theme={theme}>
        <ToastProvider>
          <SchemaErrorsScreen schema={SCHEMA} context={context} />
        </ToastProvider>
      </ThemeProvider>,
    )
  })
}

describe('SchemaErrorsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true})
  })

  // prepareConfig throws above LocaleProvider, so on that path every label falls
  // back to its inline default rather than rendering a bare key.
  it('renders readable copy without a locale provider', async () => {
    await renderScreen(CONTEXT)

    expect(screen.getByRole('heading', {name: 'Schema errors'})).toBeInTheDocument()
    const location = screen.getByTestId('schema-error-location')
    expect(within(location).getByText('Error location')).toBeInTheDocument()
    expect(within(location).getByText('Workspace')).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('schema-errors.')
  })

  it('names the workspace, project and dataset that failed', async () => {
    await renderScreen(CONTEXT)

    const location = screen.getByTestId('schema-error-location')
    expect(within(location).getByText('broken')).toBeInTheDocument()
    expect(within(location).getByText('riot')).toBeInTheDocument()
    expect(within(location).getByText('live')).toBeInTheDocument()
    expect(within(location).queryByText('Source')).not.toBeInTheDocument()
  })

  it('names the source as well when a nested source failed', async () => {
    await renderScreen({...CONTEXT, sourceName: 'secondary'})

    const location = screen.getByTestId('schema-error-location')
    expect(within(location).getByText('Source')).toBeInTheDocument()
    expect(within(location).getByText('secondary')).toBeInTheDocument()
  })

  it('omits the location card when the thrower gave no context', async () => {
    await renderScreen()

    expect(screen.queryByTestId('schema-error-location')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', {name: 'Schema errors'})).toBeInTheDocument()
  })

  it('carries the location into the clipboard payload', async () => {
    await renderScreen(CONTEXT)

    await userEvent.click(screen.getByRole('button', {name: 'Copy to clipboard'}))

    expect(writeText).toHaveBeenCalledTimes(1)
    const [copied] = writeText.mock.calls[0] as unknown as [string]
    expect(copied).toContain('- Workspace: broken')
    expect(copied).toContain('- Project ID: riot')
    expect(copied).toContain('- Dataset: live')
    expect(copied).toContain('Unknown type: article.')
  })
})
