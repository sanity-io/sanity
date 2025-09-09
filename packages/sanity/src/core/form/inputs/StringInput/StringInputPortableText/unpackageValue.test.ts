import {expect, it} from 'vitest'

import {unpackageValue} from './unpackageValue'

it('extracts the primitive value from a Portable Text value', () => {
  expect(
    unpackageValue([
      {
        _key: 'root',
        _type: 'block',
        children: [
          {
            _key: 'root',
            _type: 'span',
            text: 'a',
          },
        ],
      },
    ]),
  ).toBe('a')
})

it('gracefully handles `undefined` output value', () => {
  expect(
    unpackageValue([
      {
        _key: 'root',
        _type: 'block',
        children: [
          {
            _key: 'root',
            _type: 'span',
            text: '',
          },
        ],
      },
    ]),
  ).toBe('')
})
