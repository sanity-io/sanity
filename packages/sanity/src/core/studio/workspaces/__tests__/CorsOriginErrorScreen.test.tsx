import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {describe, expect, it} from 'vitest'

import {CorsOriginErrorScreen} from '../CorsOriginErrorScreen'

const theme = buildTheme()
const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
)

const CORS_DOCS_URL = 'https://www.sanity.io/docs/cors'
const STUDIO_REGISTRATION_DOCS_URL = 'https://www.sanity.io/docs/dashboard/dashboard-configure'

describe('CorsOriginErrorScreen', () => {
  it('links to Studio registration and CORS docs when Register Studio is offered', () => {
    render(
      <CorsOriginErrorScreen
        allowed={false}
        isStaging={false}
        origin="https://studio.example.com"
        primaryProjectId="project-a"
        projectId="project-a"
        withCredentials={false}
      />,
      {wrapper},
    )

    expect(screen.getByRole('heading', {name: 'Connect this Studio to your project'})).toBeVisible()
    expect(screen.getByRole('link', {name: 'Register Studio'})).toBeVisible()
    expect(screen.queryByRole('link', {name: 'Need help with CORS? →'})).not.toBeInTheDocument()

    const registrationLink = screen.getByRole('link', {name: 'Learn about Studio registration →'})
    expect(registrationLink).toHaveAttribute('href', STUDIO_REGISTRATION_DOCS_URL)
    expect(registrationLink).toHaveAttribute('target', '_blank')

    const corsLink = screen.getByRole('link', {name: 'Learn about CORS origins →'})
    expect(corsLink).toHaveAttribute('href', CORS_DOCS_URL)
    expect(corsLink).toHaveAttribute('target', '_blank')
  })

  it('omits the Studio registration docs link when Register Studio is hidden', () => {
    render(
      <CorsOriginErrorScreen
        allowed={false}
        isStaging={false}
        origin="http://localhost:3333"
        primaryProjectId="project-a"
        projectId="project-a"
        withCredentials={false}
      />,
      {wrapper},
    )

    expect(screen.queryByRole('link', {name: 'Register Studio'})).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', {name: 'Learn about Studio registration →'}),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Learn about CORS origins →'})).toHaveAttribute(
      'href',
      CORS_DOCS_URL,
    )
  })

  it('keeps CORS-only help on the credentials-disabled screen', () => {
    render(
      <CorsOriginErrorScreen
        allowed
        isStaging={false}
        origin="https://studio.example.com"
        primaryProjectId="project-a"
        projectId="project-a"
        withCredentials={false}
      />,
      {wrapper},
    )

    expect(screen.getByRole('heading', {name: 'Enable credentials for this Studio'})).toBeVisible()
    expect(
      screen.queryByRole('link', {name: 'Learn about Studio registration →'}),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Learn about CORS origins →'})).toHaveAttribute(
      'href',
      CORS_DOCS_URL,
    )
  })
})
