import {describe, expect, it} from 'vitest'

import {resolveIcon} from '../resolveIcon'

describe('resolveIcon', () => {
  it('should render an SVG icon', async () => {
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

  it('should return raw renderToString output without sanitize (API path)', async () => {
    const unsanitized = await resolveIcon({title: 'My Studio'})
    const sanitized = await resolveIcon({title: 'My Studio', sanitize: true})

    // Raw React output contains comment nodes (<!-- -->) between text,
    // which DOMPurify strips during sanitization
    expect(unsanitized).toContain('<!--')
    expect(sanitized).not.toContain('<!--')
    // Both should contain the initials
    expect(unsanitized).toContain('M')
    expect(sanitized).toContain('M')
  })

  it('should render fallback initials when no icon is provided', async () => {
    const result = await resolveIcon({title: 'My Studio'})

    expect(result).toBeTruthy()
    expect(result).toContain('>M<')
    expect(result).toContain('>S<')
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
