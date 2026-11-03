import {describe, expect, it} from 'vitest'

import {getReleaseDescriptionText} from '../getReleaseDescriptionText'

const block = {
  _key: 'block1',
  _type: 'block',
  style: 'normal',
  markDefs: [],
  children: [
    {_key: 'span1', _type: 'span', text: 'testing ', marks: []},
    {_key: 'ref1', _type: 'releaseReference', releaseId: 'r0IWxZEkm'},
    {_key: 'span2', _type: 'span', text: 'bananas', marks: ['strong']},
  ],
}

describe('getReleaseDescriptionText', () => {
  it('returns a string description unchanged', () => {
    expect(getReleaseDescriptionText('A drop')).toBe('A drop')
    expect(getReleaseDescriptionText('  padded  ')).toBe('  padded  ')
  })

  it('returns an empty string when the description is missing', () => {
    expect(getReleaseDescriptionText(undefined)).toBe('')
    expect(getReleaseDescriptionText(null)).toBe('')
  })

  it('reads the span text from portable text and skips inline objects', () => {
    expect(getReleaseDescriptionText([block])).toBe('testing bananas')
  })

  it('keeps paragraph breaks between blocks', () => {
    expect(
      getReleaseDescriptionText([
        block,
        {
          _key: 'block2',
          _type: 'block',
          children: [{_key: 'span3', _type: 'span', text: 'next', marks: []}],
          markDefs: [],
          style: 'normal',
        },
      ]),
    ).toBe('testing bananas\n\nnext')
  })

  it('reads a single portable text block', () => {
    expect(getReleaseDescriptionText(block)).toBe('testing bananas')
  })

  it('returns an empty string for values that are not text', () => {
    expect(getReleaseDescriptionText(12)).toBe('')
    expect(getReleaseDescriptionText({_type: 'not-a-block'})).toBe('')
    expect(getReleaseDescriptionText(['plain'])).toBe('')
    expect(getReleaseDescriptionText([null, {_type: 'block', children: null}])).toBe('')
  })
})
