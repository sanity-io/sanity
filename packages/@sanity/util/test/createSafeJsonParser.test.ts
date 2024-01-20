import {expect, test} from '@jest/globals'

import {createSafeJsonParser} from '../src/createSafeJsonParser'

const parse = createSafeJsonParser({
  errorLabel: 'Error parsing JSON',
})

test('parse JSON', () => {
  expect(parse('{"someString": "string"}')).toEqual({someString: 'string'})
  expect(parse('{"someNumber": 42}')).toEqual({someNumber: 42})
})

test('parse JSON with interrupting error', () => {
  expect(() => parse('{"someString": "str{"error":{"description":"Some error"}}'))
    .toThrowErrorMatchingInlineSnapshot(`
"Error parsing JSON: Some error

{\\"error\\":{\\"description\\":\\"Some error\\"}}
"
`)
})
