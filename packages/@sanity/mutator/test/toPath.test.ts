import {expect, test} from '@jest/globals'

import {parseJsonPath} from '../src/jsonpath/parse'
import {toPath} from '../src/jsonpath/toPath'

const cases = [
  'a.b.c',
  'a.b[5]',
  '[1,2,3]',
  '[1:4]',
  '[count > 5]',
  '..a',
  '[name == "\\"quoted\\""]',
]

cases.forEach((path, i) => {
  test(`case #${i}`, () => {
    const parsed = parseJsonPath(path)
    if (!parsed) {
      throw new Error(`Failed to parse path "${path}"`)
    }
    expect(path).toEqual(toPath(parsed))
  })
})
