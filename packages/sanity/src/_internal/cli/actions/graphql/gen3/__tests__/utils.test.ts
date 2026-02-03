import {getFilterFieldName} from '../utils'
import {expect, test} from 'vitest'

test('#getFilterFieldName with no suffix argument', () => {
  expect(getFilterFieldName('foo')).toBe('fooFilter')
})

test('#getFilterFieldName with suffix argument', () => {
  expect(getFilterFieldName('foo', 'bar')).toBe('foobar')
})
