import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {describe, expect, it} from 'vitest'

import {getReleaseActionTooltipContent} from '../getReleaseActionTooltipContent'

const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={studioTheme}>{children}</ThemeProvider>
)

describe('getReleaseActionTooltipContent', () => {
  it('returns null when tooltipText is null', () => {
    expect(getReleaseActionTooltipContent(null, false)).toBeNull()
  })

  it('returns null when tooltipText is undefined', () => {
    expect(getReleaseActionTooltipContent(undefined, false)).toBeNull()
  })

  it('renders tooltip text when provided', () => {
    const result = getReleaseActionTooltipContent('Validation error', false)
    render(<>{result}</>, {wrapper})

    expect(screen.getByText('Validation error')).toBeInTheDocument()
  })

  it('renders tooltip with ReactNode content', () => {
    const result = getReleaseActionTooltipContent(
      <span data-testid="custom-node">Custom</span>,
      false,
    )
    render(<>{result}</>, {wrapper})

    expect(screen.getByTestId('custom-node')).toBeInTheDocument()
  })

  it('passes isValidatingDocuments=false → critical tone CSS var to ToneIcon', () => {
    const result = getReleaseActionTooltipContent('Error', false)
    const {container} = render(<>{result}</>, {wrapper})

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('style')).toContain('--card-badge-critical-icon-color')
  })

  it('passes isValidatingDocuments=true → default tone CSS var to ToneIcon', () => {
    const result = getReleaseActionTooltipContent('Validating...', true)
    const {container} = render(<>{result}</>, {wrapper})

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('style')).toContain('--card-badge-default-icon-color')
  })
})
