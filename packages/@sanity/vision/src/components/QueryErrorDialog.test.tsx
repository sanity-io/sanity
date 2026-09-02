import {type ClientPerspective, ClientError} from '@sanity/client'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {prefixApiVersion} from '../util/prefixApiVersion'
import {QueryErrorDialog} from './QueryErrorDialog'

const theme = buildTheme()

const sanityMocks = vi.hoisted(() => ({
  releasesApiVersion: 'v2099-01-01',
  variantsApiVersion: 'X',
}))

vi.mock('sanity', () => ({
  useTranslation: () => ({
    t: (key: string, values?: {apiVersion?: string}) =>
      values?.apiVersion ? `${key}:${values.apiVersion}` : key,
  }),
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  RELEASES_STUDIO_CLIENT_OPTIONS: {apiVersion: sanityMocks.releasesApiVersion},
  VARIANTS_STUDIO_CLIENT_OPTIONS: {apiVersion: sanityMocks.variantsApiVersion},
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
  variant,
}: {
  error?: Error
  apiVersion?: string
  perspective?: ClientPerspective
  variant?: string
} = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryErrorDialog
        apiVersion={apiVersion}
        error={error}
        perspective={perspective}
        variant={variant}
      />
    </ThemeProvider>,
  )
}

describe('QueryErrorDialog', () => {
  afterEach(cleanup)

  it('appends a release-perspective hint for a 400 on an old API version without replacing the raw error', () => {
    renderDialog()

    expect(screen.getByTestId('query-error-api-version-capability-hint').textContent).toBe(
      `query.error.unsupported-release-perspective:${prefixApiVersion(sanityMocks.releasesApiVersion)}`,
    )
    expect(screen.getByText(/Complex perspectives are not supported for this version/)).toBeTruthy()
  })

  it('names the variant requirement when a variant and a release stack are both present', () => {
    renderDialog({variant: 'french'})

    expect(screen.getByTestId('query-error-api-version-capability-hint').textContent).toBe(
      `query.error.unsupported-variant:${prefixApiVersion(sanityMocks.variantsApiVersion)}`,
    )
    expect(screen.getByText(/Complex perspectives are not supported for this version/)).toBeTruthy()
  })

  it('does not show the hint when the stack is only published', () => {
    renderDialog({perspective: ['published']})

    expect(screen.queryByTestId('query-error-api-version-capability-hint')).toBeNull()
    expect(screen.getByText(/Complex perspectives are not supported for this version/)).toBeTruthy()
  })

  it('does not show the hint for a non-400 error', () => {
    renderDialog({
      error: clientError(403, 'Forbidden'),
    })

    expect(screen.queryByTestId('query-error-api-version-capability-hint')).toBeNull()
    expect(screen.getByText(/Forbidden/)).toBeTruthy()
  })

  it('does not show the hint for a plain Error without a status code', () => {
    renderDialog({error: new Error('Parameters are not valid JSON')})

    expect(screen.queryByTestId('query-error-api-version-capability-hint')).toBeNull()
    expect(screen.getByText('Parameters are not valid JSON')).toBeTruthy()
  })
})
