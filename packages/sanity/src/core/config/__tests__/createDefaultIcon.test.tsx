import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createDefaultIcon} from '../createDefaultIcon'

function renderIcon(title: string, subtitle = '') {
  return render(
    <ThemeProvider theme={studioTheme}>{createDefaultIcon(title, subtitle)}</ThemeProvider>,
  )
}

describe('createDefaultIcon', () => {
  it('should render the first letter of a single word title', () => {
    renderIcon('Studio')
    expect(screen.getByText('S')).toBeInTheDocument()
  })

  it('should render the first two letters of a multi-word title', () => {
    renderIcon('My Studio')
    expect(screen.getByText('MS')).toBeInTheDocument()
  })

  it('should handle titles with emojis by ignoring them', () => {
    // This tests the fix for the Sentry error where emojis caused lone surrogates
    renderIcon('Staging 🟠')
    expect(screen.getByText('S')).toBeInTheDocument()
  })

  it('should handle titles with multiple emojis', () => {
    renderIcon('🎉 Party Time 🎊')
    expect(screen.getByText('PT')).toBeInTheDocument()
  })

  it('should handle titles that are only emojis', () => {
    renderIcon('🟢')
    // When the title is only emojis, after filtering there should be no letters
    // The component should handle this gracefully (empty text)
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should handle titles with special unicode characters', () => {
    renderIcon('Producción 🟢')
    expect(screen.getByText('P')).toBeInTheDocument()
  })

  it('should handle titles with accented characters', () => {
    renderIcon('Café Résumé')
    expect(screen.getByText('CR')).toBeInTheDocument()
  })

  it('should not produce lone surrogates in the output', () => {
    // Render a title with emojis
    const {container} = renderIcon('Test 🟠 Title')

    // Get all text content and check for lone surrogates
    const textContent = container.textContent || ''

    // Regex to detect lone surrogates
    const loneSurrogateRegex =
      /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/

    expect(textContent).not.toMatch(loneSurrogateRegex)
  })

  it('should handle complex emoji like flags', () => {
    // Flag emojis are composed of multiple code points
    renderIcon('🇺🇸 USA')
    expect(screen.getByText('U')).toBeInTheDocument()
  })
})
