import {expect, test} from 'vitest'

import {createSafeJsonParser} from '../src/createSafeJsonParser'

const parse = createSafeJsonParser({
  errorLabel: 'Error parsing JSON',
})

test('parse JSON', () => {
  expect(parse('{"someString": "string"}')).toEqual({someString: 'string'})
  expect(parse('{"someNumber": 42}')).toEqual({someNumber: 42})
})

// Temporary test to trigger GitHub Actions retry workflow
// TODO: Remove this test after verifying retry functionality
test('TEMP: trigger retry workflow - will fail on first attempt', () => {
  // This test will always fail to trigger the retry workflow
  // Remove this test once retry functionality is verified
  expect(true).toBe(false)
})

test('parse JSON with interrupting error', () => {
  expect(() => parse('{"someString": "str{"error":{"description":"Some error"}}'))
    .toThrowErrorMatchingInlineSnapshot(`
      [Error: Error parsing JSON: Some error

      {"error":{"description":"Some error"}}
      ]
    `)
})
