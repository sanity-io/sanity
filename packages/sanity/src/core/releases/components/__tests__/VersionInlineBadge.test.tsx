import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {VersionInlineBadge} from '../VersionInlineBadge'

describe('VersionInlineBadge', () => {
  it('renders a plain span with the name when it has no icon and no truncate', () => {
    render(<VersionInlineBadge data-testid="badge">Spring launch</VersionInlineBadge>)

    const badge = screen.getByTestId('badge')
    expect(badge.tagName).toBe('SPAN')
    expect(badge).not.toHaveAttribute('data-inline-chip')
    expect(badge.querySelector('[data-inline-chip-name]')).toBeNull()
    expect(badge).toHaveTextContent('Spring launch')
  })

  it('renders the truncating chip with its glyph when it has an icon', () => {
    render(
      <VersionInlineBadge data-testid="badge" icon={<svg data-testid="glyph" />}>
        Germany
      </VersionInlineBadge>,
    )

    const badge = screen.getByTestId('badge')
    expect(badge).toHaveAttribute('data-inline-chip')
    expect(badge.querySelector('[data-inline-chip-icon] [data-testid="glyph"]')).not.toBeNull()
    expect(badge.querySelector('[data-inline-chip-name]')).toHaveTextContent('Germany')
  })

  it('renders the truncating chip without a glyph when asked to truncate', () => {
    render(
      <VersionInlineBadge data-testid="badge" truncate>
        Drafts
      </VersionInlineBadge>,
    )

    const badge = screen.getByTestId('badge')
    expect(badge).toHaveAttribute('data-inline-chip')
    expect(badge).not.toHaveAttribute('truncate')
    expect(badge.querySelector('[data-inline-chip-icon]')).toBeNull()
  })
})
