import {type SanityDocument} from 'sanity'
import {expect, it} from 'vitest'

import {mustChooseNewDocumentDestination} from './mustChooseNewDocumentDestination'

const stubDocument: SanityDocument = {
  _id: 'x',
  _rev: 'x',
  _type: 'x',
  _createdAt: '2025-06-23',
  _updatedAt: '2025-06-23',
}

it('returns `undefined` while the state is indeterminate', () => {
  expect(
    mustChooseNewDocumentDestination({
      editState: {
        ready: false,
        draft: null,
        version: null,
        published: null,
      },
      isSelectedPerspectiveWriteable: {
        result: true,
      },
    }),
  ).toBeUndefined()

  expect(
    mustChooseNewDocumentDestination({
      editState: {
        ready: false,
        draft: null,
        version: null,
        published: null,
      },
      isSelectedPerspectiveWriteable: {
        result: false,
        reason: 'PUBLISHED_NOT_WRITEABLE',
      },
    }),
  ).toBeUndefined()
})

it('returns `true` if the user is creating a new document, but the selected perspective is not writable', () => {
  expect(
    mustChooseNewDocumentDestination({
      editState: {
        ready: true,
        draft: null,
        version: null,
        published: null,
      },
      isSelectedPerspectiveWriteable: {
        result: false,
        reason: 'PUBLISHED_NOT_WRITEABLE',
      },
    }),
  ).toBe(true)
})

it('returns `false` if the user is creating a new document, and the perspective is writable', () => {
  expect(
    mustChooseNewDocumentDestination({
      editState: {
        ready: true,
        draft: null,
        version: null,
        published: null,
      },
      isSelectedPerspectiveWriteable: {
        result: true,
      },
    }),
  ).toBe(false)
})

it('returns `false` if the user is not creating a new document, regardless of whether the perspective is writable', () => {
  expect(
    mustChooseNewDocumentDestination({
      editState: {
        ready: true,
        draft: stubDocument,
        version: null,
        published: null,
      },
      isSelectedPerspectiveWriteable: {
        result: false,
        reason: 'PUBLISHED_NOT_WRITEABLE',
      },
    }),
  ).toBe(false)

  expect(
    mustChooseNewDocumentDestination({
      editState: {
        ready: true,
        draft: stubDocument,
        version: null,
        published: null,
      },
      isSelectedPerspectiveWriteable: {
        result: true,
      },
    }),
  ).toBe(false)
})
