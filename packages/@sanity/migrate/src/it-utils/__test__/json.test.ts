import {parseJSON} from '../json'
import {createSafeJsonParser} from '../createSafeJsonParser'

test('parse JSON', async () => {
  const gen = async function* () {
    yield '{"someString": "string"}'
    yield '{"someNumber": 42}'
  }

  const it = parseJSON(gen(), {})

  expect(await it.next()).toEqual({value: {someString: 'string'}, done: false})
  expect(await it.next()).toEqual({value: {someNumber: 42}, done: false})
  expect(await it.next()).toEqual({value: undefined, done: true})
})

test('parse JSON with interrupting error', async () => {
  const gen = async function* () {
    yield '{"someString": "string"}'
    yield '{"someString": "str{"error":{"description":"Some error"}}'
  }

  const it = parseJSON(gen(), {
    parse: createSafeJsonParser({
      errorLabel: 'Error parsing JSON',
    }),
  })

  expect(await it.next()).toEqual({value: {someString: 'string'}, done: false})

  await expect(async () => {
    await it.next()
  }).rejects.toThrowErrorMatchingInlineSnapshot(`
"Error parsing JSON: Some error

{\\"error\\":{\\"description\\":\\"Some error\\"}}
"
`)
})
