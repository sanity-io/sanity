import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {ClampedRect} from './ClampedRect'

describe('ClampedRect', () => {
  it('clamps the rect to its bounds as SVG geometry attributes', () => {
    render(
      <svg>
        <ClampedRect
          data-testid="rect"
          top={10}
          left={5}
          height={40}
          width={2}
          bounds={{top: 20, left: 0, height: 100, width: 100}}
        />
      </svg>,
    )

    const rect = screen.getByTestId('rect')
    expect(rect).toHaveAttribute('x', '5')
    expect(rect).toHaveAttribute('y', '20')
    expect(rect).toHaveAttribute('height', '30')
    expect(rect).toHaveAttribute('width', '2')
    // `top` and `left` are not SVG attributes; they only position the rect before clamping.
    expect(rect).not.toHaveAttribute('top')
    expect(rect).not.toHaveAttribute('left')
  })
})
