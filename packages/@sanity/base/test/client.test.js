import client from '../src/client'

test('client should be exposed in CommonJS format', () => {
  expect(typeof client.fetch).toBe('function')
})

test('client should still expose client on .default, but give warning', () => {
  expect(typeof client.default.fetch).toBe('function')
})
