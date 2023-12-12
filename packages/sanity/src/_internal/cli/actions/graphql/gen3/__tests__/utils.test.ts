import {getFilterFieldName} from '../utils'

test('#getFilterFieldName with no suffix argument', () => {
  expect(getFilterFieldName('foo')).toBe('fooFilter')
})

test('#getFilterFieldName with suffix argument', () => {
  expect(getFilterFieldName('foo', 'bar')).toBe('foobar')
})
