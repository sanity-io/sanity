import {calculateScore} from '../src/search/weighted/applyWeights'

test('Exact match', () => {
  expect(calculateScore(['foo'], 'foo')).toEqual([1, 'Exact match'])
  expect(calculateScore(['foo'], 'foo foo')).toEqual([1, 'Exact match'])
  expect(calculateScore(['foo', 'foo'], 'foo foo')).toEqual([1, 'Exact match'])
  expect(calculateScore(['bar', 'foo'], 'foo bar')).toEqual([1, 'Exact match'])
  expect(calculateScore(['foo', 'bar'], 'bar, foo')).toEqual([1, 'Exact match'])
  expect(calculateScore(['foo', 'bar'], 'bar & foo')).toEqual([1, 'Exact match'])
})

test('partial match', () => {
  expect(calculateScore(['foo'], 'bar foo')).toEqual([0.25, 'Matched 1 of 2 terms: [foo]'])
  expect(calculateScore(['foo', 'bar'], 'foo')).toEqual([0.25, `Matched 1 of 2 terms: [foo]`])
  expect(calculateScore(['foo', 'bar', 'baz'], 'foo foo bar')).toEqual([
    1 / 3,
    `Matched 2 of 3 terms: [foo, bar]`
  ])
})
