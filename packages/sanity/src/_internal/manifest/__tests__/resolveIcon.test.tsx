import {describe, expect, it} from 'vitest'

import {resolveIcon} from '../resolveIcon'

describe('resolveIcon', () => {
  it('should render an SVG icon and return sanitized HTML', async () => {
    const result = await resolveIcon({
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

  it('should strip dangerous attributes from output', async () => {
    const result = await resolveIcon({
      icon: () => (
        // eslint-disable-next-line react/no-unknown-property
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

  it('should render fallback initials when no icon is provided', async () => {
    const result = await resolveIcon({title: 'My Studio'})

    expect(result).toBeTruthy()
    expect(result).toContain('MS')
  })

  it('should return undefined when icon rendering throws', async () => {
    const result = await resolveIcon({
      icon: () => {
        throw new Error('render failure')
      },
      title: 'Test',
    })

    expect(result).toBeUndefined()
  })
})
