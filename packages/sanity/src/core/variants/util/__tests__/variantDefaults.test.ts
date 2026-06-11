import {describe, expect, it} from 'vitest'

import {createPortableTextDescription} from '../variantDefaults'

describe('createPortableTextDescription', () => {
  it('returns an empty array for whitespace-only input', () => {
    expect(createPortableTextDescription('')).toEqual([])
    expect(createPortableTextDescription('   ')).toEqual([])
  })

  it('preserves untrimmed text in the portable text block', () => {
    const description = createPortableTextDescription('  hello world  ')

    expect(description).toHaveLength(1)
    expect(description[0]?.children[0]?.text).toBe('  hello world  ')
  })

  it('creates a single normal block for non-empty input', () => {
    const description = createPortableTextDescription('Developer audience')

    expect(description).toEqual([
      expect.objectContaining({
        _type: 'block',
        style: 'normal',
        children: [
          expect.objectContaining({
            _type: 'span',
            text: 'Developer audience',
          }),
        ],
      }),
    ])
  })
})
