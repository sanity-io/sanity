import {expect, it} from 'vitest'

import {hashData} from './hashData'

it('hashes objects', async () => {
  const hash = await hashData({
    a: 'alpha',
    b: 'beta',
    c: 'gamma',
  })

  expect(hash).toMatchInlineSnapshot(`"8ccbabd4569d7c8e1e5cdf873434365a4eec2fa1"`)
})

it('hashes empty objects', async () => {
  const hash = await hashData({})

  expect(hash).toMatchInlineSnapshot(`"bf21a9e8fbc5a3846fb05b4fa0859e0917b2202f"`)
})

it('produces the same hash for matching objects, regardless of key order', async () => {
  const [hashA, hashB] = await Promise.all([
    hashData({
      a: 'alpha',
      b: 'beta',
      c: 'gamma',
    }),
    hashData({
      c: 'gamma',
      a: 'alpha',
      b: 'beta',
    }),
  ])

  expect(hashA).toBe(hashB)
})

it('hashes arrays', async () => {
  const hash = await hashData(['alpha', 'beta', 0, 1, true, false, null, undefined, {a: 'alpha'}])

  expect(hash).toMatchInlineSnapshot(`"89cee8a43a6b1f4385a6a34df324c8a2bf55e807"`)
})

it('hashes empty arrays', async () => {
  const hash = await hashData([])

  expect(hash).toMatchInlineSnapshot(`"97d170e1550eee4afc0af065b78cda302a97674c"`)
})

it('hashes strings', async () => {
  const hash = await hashData('alpha')

  expect(hash).toMatchInlineSnapshot(`"be76331b95dfc399cd776d2fc68021e0db03cc4f"`)
})

it('hashes numbers', async () => {
  const hash = await hashData(0)

  expect(hash).toMatchInlineSnapshot(`"b6589fc6ab0dc82cf12099d1c2d40ab994e8410c"`)
})

it('hashes null', async () => {
  const hash = await hashData(null)

  expect(hash).toMatchInlineSnapshot(`"2be88ca4242c76e8253ac62474851065032d6833"`)
})

it('hashes undefined', async () => {
  const hash = await hashData(undefined)

  expect(hash).toMatchInlineSnapshot(`"da39a3ee5e6b4b0d3255bfef95601890afd80709"`)
})

it('hashes booleans', async () => {
  const [hashTrue, hashFalse] = await Promise.all([hashData(true), hashData(false)])

  expect(hashTrue).toMatchInlineSnapshot(`"5ffe533b830f08a0326348a9160afafc8ada44db"`)
  expect(hashFalse).toMatchInlineSnapshot(`"7cb6efb98ba5972a9b5090dc2e517fe14d12cb04"`)
})
