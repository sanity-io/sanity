import {type ClientPerspective, ClientError} from '@sanity/client'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {QueryErrorDialog} from './QueryErrorDialog'

const theme = buildTheme()

vi.mock('sanity', () => ({
  useTranslation: () => ({
    t: (key: string, values?: {apiVersion?: string}) =>
      values?.apiVersion ? `${key}:${values.apiVersion}` : key,
  }),
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  RELEASES_STUDIO_CLIENT_OPTIONS: {apiVersion: 'v2025-02-19'},
}))

function clientError(statusCode: number, message: string) {
  return new ClientError({
    statusCode,
    statusMessage: 'Bad Request',
    headers: {},
    body: {message},
    url: 'https://api.sanity.io/v2021-03-25/data/query/test',
    method: 'GET',
  })
}

function renderDialog({
  error = clientError(400, 'Complex perspectives are not supported for this version'),
  apiVersion = 'v2021-03-25',
  perspective = ['rapp2157', 'drafts'],
}: {
  error?: Error
  apiVersion?: string
  perspective?: ClientPerspective
} = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryErrorDialog apiVersion={apiVersion} error={error} perspective={perspective} />
    </ThemeProvider>,
  )
}

describe('QueryErrorDialog', () => {
  afterEach(cleanup)

  it('appends a release-perspective hint for a 400 on an old API version without replacing the raw error', () => {
    renderDialog()

    expect(screen.getByTestId('query-error-release-perspective-hint').textContent).toBe(
      'query.error.unsupported-release-perspective:v2025-02-19',
    )
    expect(screen.getByText(/Complex perspectives are not supported for this version/)).toBeTruthy()
  })

  it('does not show the hint when the stack is only published', () => {
    renderDialog({perspective: ['published']})

    expect(screen.queryByTestId('query-error-release-perspective-hint')).toBeNull()
    expect(screen.getByText(/Complex perspectives are not supported for this version/)).toBeTruthy()
  })

  it('does not show the hint for a non-400 error', () => {
    renderDialog({
      error: clientError(403, 'Forbidden'),
    })

    expect(screen.queryByTestId('query-error-release-perspective-hint')).toBeNull()
    expect(screen.getByText(/Forbidden/)).toBeTruthy()
  })

  it('does not show the hint for a plain Error without a status code', () => {
    renderDialog({error: new Error('Parameters are not valid JSON')})

    expect(screen.queryByTestId('query-error-release-perspective-hint')).toBeNull()
    expect(screen.getByText('Parameters are not valid JSON')).toBeTruthy()
  })
})
