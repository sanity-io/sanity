import {type SanityDocument} from '@sanity/types'
import {expect, it} from 'vitest'

import {isNewDocument} from './isNewDocument'

const stubDocument: SanityDocument = {
  _id: 'x',
  _rev: 'x',
  _type: 'x',
  _createdAt: '2025-06-23',
  _updatedAt: '2025-06-23',
}

it('returns `undefined` while the state is indeterminate', () => {
  expect(
    isNewDocument({
      ready: false,
      draft: null,
      version: null,
      published: null,
    }),
  ).toBeUndefined()
})

it('returns `true` if no version is present', () => {
  expect(
    isNewDocument({
      ready: true,
      draft: null,
      version: null,
      published: null,
    }),
  ).toBe(true)
})

it('returns `false` if any version is present', () => {
  expect(
    isNewDocument({
      ready: true,
      draft: stubDocument,
      version: null,
      published: null,
    }),
  ).toBe(false)

  expect(
    isNewDocument({
      ready: true,
      draft: null,
      version: stubDocument,
      published: null,
    }),
  ).toBe(false)

  expect(
    isNewDocument({
      ready: true,
      draft: null,
      version: null,
      published: stubDocument,
    }),
  ).toBe(false)
})
