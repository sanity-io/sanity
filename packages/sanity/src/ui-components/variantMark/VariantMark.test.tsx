import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {VariantMark} from './VariantMark'

function getMark() {
  return screen.getByTestId('mark')
}

describe('VariantMark', () => {
  it('defaults to a filled, inline mark', () => {
    render(<VariantMark data-testid="mark" />)
    expect(getMark()).toHaveAttribute('data-size', 'inline')
    expect(getMark()).toHaveAttribute('data-fill', 'filled')
    expect(getMark().firstElementChild).toHaveAttribute('viewBox', '8.555 8.555 7.889 7.889')
    // the mark owns its colour, so buttons and menu items must not repaint the glyph
    expect(getMark().firstElementChild).not.toHaveAttribute('data-sanity-icon')
  })

  it('draws the row size with a different class than inline', () => {
    const {rerender} = render(<VariantMark data-testid="mark" size="inline" />)
    const inlineClass = getMark().className
    rerender(<VariantMark data-testid="mark" size="row" />)
    expect(getMark()).toHaveAttribute('data-size', 'row')
    expect(getMark().className).not.toEqual(inlineClass)
  })

  it('draws the outline glyph for fill="outline"', () => {
    render(<VariantMark data-testid="mark" fill="outline" />)
    expect(getMark()).toHaveAttribute('data-fill', 'outline')
    expect(getMark().firstElementChild).toHaveAttribute('viewBox', '7.73 7.73 9.54 9.54')
  })

  it('is decorative by default', () => {
    render(<VariantMark data-testid="mark" />)
    expect(getMark()).toHaveAttribute('aria-hidden', 'true')
  })

  it('is exposed when given an accessible name', () => {
    render(<VariantMark data-testid="mark" aria-label="Variant" />)
    expect(getMark()).not.toHaveAttribute('aria-hidden')
    expect(getMark()).toHaveAttribute('aria-label', 'Variant')
  })

  it('merges a caller class name', () => {
    const {rerender} = render(<VariantMark data-testid="mark" />)
    const baseCount = getMark().className.split(' ').length
    rerender(<VariantMark data-testid="mark" className="extra" />)
    expect(getMark()).toHaveClass('extra')
    expect(getMark().className.split(' ')).toHaveLength(baseCount + 1)
  })
})
