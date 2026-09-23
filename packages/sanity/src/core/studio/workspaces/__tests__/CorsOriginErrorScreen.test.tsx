import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render, screen, within} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {CorsOriginErrorScreen} from '../CorsOriginErrorScreen'

const theme = buildTheme()
const CORS_DOCS_URL = 'https://www.sanity.io/docs/cors'
const STUDIO_REGISTRATION_DOCS_URL = 'https://www.sanity.io/docs/dashboard/dashboard-configure'

function renderScreen(
  props: Partial<Parameters<typeof CorsOriginErrorScreen>[0]> &
    Pick<Parameters<typeof CorsOriginErrorScreen>[0], 'origin'>,
) {
  return render(
    <ThemeProvider theme={theme}>
      <CorsOriginErrorScreen
        isStaging={false}
        primaryProjectId="abc123"
        projectId="abc123"
        {...props}
      />
    </ThemeProvider>,
  )
}

describe('CorsOriginErrorScreen', () => {
  it('links Studio registration docs next to CORS docs on the connect screen', () => {
    renderScreen({origin: 'https://studio.example.com'})

    const screenRoot = screen.getByTestId('studio-error-screen')
    expect(screenRoot).toHaveAttribute('data-error', 'CORS origin error')
    expect(
      within(screenRoot).getByRole('heading', {name: 'Connect this Studio to your project'}),
    ).toBeInTheDocument()
    expect(within(screenRoot).getByRole('link', {name: 'Register Studio'})).toBeInTheDocument()

    const registrationLink = screen.getByTestId('studio-registration-docs-link')
    expect(registrationLink).toHaveTextContent('Learn about Studio registration')
    expect(registrationLink).toHaveAttribute('href', STUDIO_REGISTRATION_DOCS_URL)
    expect(registrationLink).toHaveAttribute('target', '_blank')

    const corsLink = screen.getByTestId('cors-docs-link')
    expect(corsLink).toHaveTextContent('Learn about CORS')
    expect(corsLink).toHaveAttribute('href', CORS_DOCS_URL)
    expect(screen.queryByText('Need help with CORS?')).not.toBeInTheDocument()
  })

  it('still offers both docs links when the origin cannot be registered', () => {
    renderScreen({origin: 'http://localhost:3333'})

    expect(screen.queryByRole('link', {name: 'Register Studio'})).not.toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Add CORS origin'})).toBeInTheDocument()
    expect(screen.getByTestId('studio-registration-docs-link')).toHaveAttribute(
      'href',
      STUDIO_REGISTRATION_DOCS_URL,
    )
    expect(screen.getByTestId('cors-docs-link')).toHaveAttribute('href', CORS_DOCS_URL)
  })

  it('keeps CORS-only help on the credentials-disabled screen', () => {
    renderScreen({
      allowed: true,
      origin: 'https://studio.example.com',
      withCredentials: false,
    })

    expect(screen.getByTestId('studio-error-screen')).toHaveAttribute(
      'data-error',
      'CORS credentials disabled',
    )
    expect(
      screen.getByRole('heading', {name: 'Enable credentials for this Studio'}),
    ).toBeInTheDocument()
    expect(screen.getByTestId('cors-docs-link')).toHaveAttribute('href', CORS_DOCS_URL)
    expect(screen.getByTestId('cors-docs-link')).toHaveTextContent('Need help with CORS?')
    expect(screen.queryByTestId('studio-registration-docs-link')).not.toBeInTheDocument()
  })
})
