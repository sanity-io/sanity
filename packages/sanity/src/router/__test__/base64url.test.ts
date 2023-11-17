import {decodeBase64Url, encodeBase64Url} from '../utils/base64url'

test('base64url: "safe" strings', () => {
  expect(decodeBase64Url(encodeBase64Url('foo'))).toBe('foo')
  expect(decodeBase64Url(encodeBase64Url('this one has spaces and stuff!'))).toBe(
    'this one has spaces and stuff!',
  )
})

test('base64url: encoded JSON', () => {
  expect(decodeBase64Url(encodeBase64Url(JSON.stringify({foo: 'bar', num: 123})))).toBe(
    JSON.stringify({foo: 'bar', num: 123}),
  )

  expect(decodeBase64Url(encodeBase64Url(JSON.stringify({foo: 'hello ⛳❤️🧀', num: 123})))).toBe(
    JSON.stringify({foo: 'hello ⛳❤️🧀', num: 123}),
  )
})

test('base64url: latin1', () => {
  expect(decodeBase64Url(encodeBase64Url('Blåbærsyltetøy'))).toBe('Blåbærsyltetøy')
  expect(decodeBase64Url(encodeBase64Url('Blåbærsyltetøy'))).toBe('Blåbærsyltetøy')
})

test('base64url: unicode', () => {
  expect(decodeBase64Url(encodeBase64Url('€'))).toBe('€')
  expect(decodeBase64Url(encodeBase64Url('😀'))).toBe('😀')
  expect(decodeBase64Url(encodeBase64Url('hello⛳❤️🧀'))).toBe('hello⛳❤️🧀')
  expect(decodeBase64Url(encodeBase64Url('👨‍👨‍👦‍👦'))).toBe('👨‍👨‍👦‍👦')
})
