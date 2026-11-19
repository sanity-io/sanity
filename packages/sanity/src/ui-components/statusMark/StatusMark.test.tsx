import {render} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {StatusMark} from './StatusMark'

describe('StatusMark', () => {
  it('declares its box, mark and size, and hides itself from assistive technology', () => {
    const {container} = render(<StatusMark mark="draft" size="list" />)
    const svg = container.querySelector('svg')!

    expect(svg).toHaveAttribute('width', '10')
    expect(svg).toHaveAttribute('height', '10')
    expect(svg).toHaveAttribute('data-mark', 'draft')
    expect(svg).toHaveAttribute('data-size', 'list')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws Draft as a ring whose stroke does not scale', () => {
    const {container} = render(<StatusMark mark="draft" />)
    const ring = container.querySelector('circle')!

    expect(ring).toHaveAttribute('fill', 'none')
    expect(ring).toHaveAttribute('stroke-width', '1.2')
    expect(ring).toHaveAttribute('vector-effect', 'non-scaling-stroke')
  })

  it('takes its tone, or the one it is given', () => {
    const {container, rerender} = render(<StatusMark mark="scheduled" />)
    const svg = () => container.querySelector('svg')!
    expect(svg().style.color).toBe('var(--card-badge-suggest-icon-color)')

    rerender(<StatusMark mark="scheduled" tone="default" />)
    expect(svg().style.color).toBe('var(--card-badge-default-icon-color)')
  })

  it("takes its tone's UI 5 emphasized foreground on a selected background", () => {
    const {container} = render(<StatusMark mark="published" selected />)
    const svg = container.querySelector('svg')!
    expect(svg.style.color).toBe('light-dark(var(--green-100), var(--green-900))')
    expect(svg).toHaveAttribute('data-selected', 'true')
  })

  it('is announced when given a name', () => {
    const {container} = render(<StatusMark mark="published" aria-label="Published" />)
    expect(container.querySelector('svg')).not.toHaveAttribute('aria-hidden')
  })
})
