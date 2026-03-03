import {describe, expect, it} from 'vitest'

import {resolveIcon} from '../resolveIcon'

describe('resolveIcon', () => {
  it('should render an SVG icon and return sanitized HTML', () => {
    const result = resolveIcon({
      icon: () => (
        <svg>
          <rect width="32" height="32" fill="red" />
        </svg>
      ),
      title: 'Test',
    })

    expect(result).toContain('<svg>')
    expect(result).toContain('<rect')
    expect(result).toContain('fill="red"')
  })

  it('should strip dangerous attributes from output', () => {
    const result = resolveIcon({
      // eslint-disable-next-line react/no-unknown-property
      icon: () => (
        <svg onLoad="alert('xss')">
          <rect width="32" height="32" />
        </svg>
      ),
      title: 'Test',
    })

    expect(result).not.toContain('onload')
    expect(result).not.toContain('alert')
    expect(result).toContain('<svg>')
  })

  it('should render fallback initials when no icon is provided', () => {
    const result = resolveIcon({title: 'My Studio'})

    expect(result).toBeTruthy()
    expect(result).toContain('MS')
  })

  it('should return null when icon rendering throws', () => {
    const result = resolveIcon({
      icon: () => {
        throw new Error('render failure')
      },
      title: 'Test',
    })

    expect(result).toBeNull()
  })
})
