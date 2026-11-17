import {defineType, type ObjectSchemaType} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {
  activeASAPRelease,
  archivedScheduledRelease,
} from '../../releases/__fixtures__/release.fixture'
import {createSchema} from '../../schema/createSchema'
import {isPerspectiveWriteable} from '../isPerspectiveWriteable'

const schema = createSchema({
  name: 'default',
  types: [
    defineType({
      name: 'noVersionsLiveEdit',
      type: 'document',
      liveEdit: true,
      versions: [],
      fields: [{name: 'title', type: 'string'}],
    }),
    defineType({
      name: 'variantsOnly',
      type: 'document',
      versions: ['variants'],
      fields: [{name: 'title', type: 'string'}],
    }),
    defineType({
      name: 'releasesOnly',
      type: 'document',
      versions: ['releases'],
      fields: [{name: 'title', type: 'string'}],
    }),
    defineType({
      name: 'liveEditPost',
      type: 'document',
      liveEdit: true,
      fields: [{name: 'title', type: 'string'}],
    }),
  ],
})

const getType = (name: string) => schema.get(name) as ObjectSchemaType

describe('isPerspectiveWriteable', () => {
  test.each(['noVersionsLiveEdit', 'variantsOnly'])(
    'does not allow writing a `%s` document to a release',
    (typeName) => {
      expect(
        isPerspectiveWriteable({
          selectedPerspective: activeASAPRelease,
          isDraftModelEnabled: true,
          schemaType: getType(typeName),
        }),
      ).toEqual({result: false, reason: 'RELEASES_NOT_SUPPORTED'})
    },
  )

  test.each(['releasesOnly', 'liveEditPost'])(
    'allows writing a `%s` document to a release',
    (typeName) => {
      expect(
        isPerspectiveWriteable({
          selectedPerspective: activeASAPRelease,
          isDraftModelEnabled: true,
          schemaType: getType(typeName),
        }),
      ).toEqual({result: true})
    },
  )

  test('does not allow writing a type without releases to a bare release id or agent bundle', () => {
    for (const selectedPerspective of ['rASAP', 'agent-abc123']) {
      expect(
        isPerspectiveWriteable({
          selectedPerspective,
          isDraftModelEnabled: true,
          schemaType: getType('variantsOnly'),
        }),
      ).toEqual({result: false, reason: 'RELEASES_NOT_SUPPORTED'})
    }
  })

  test('reports `RELEASES_NOT_SUPPORTED` before `RELEASE_NOT_ACTIVE`', () => {
    expect(
      isPerspectiveWriteable({
        selectedPerspective: archivedScheduledRelease,
        isDraftModelEnabled: true,
        schemaType: getType('variantsOnly'),
      }),
    ).toEqual({result: false, reason: 'RELEASES_NOT_SUPPORTED'})
  })

  test('allows a live-edit type without versions to be written to published and drafts', () => {
    for (const selectedPerspective of ['published', 'drafts'] as const) {
      expect(
        isPerspectiveWriteable({
          selectedPerspective,
          isDraftModelEnabled: true,
          schemaType: getType('noVersionsLiveEdit'),
        }),
      ).toEqual({result: true})
    }
  })

  test('keeps the draft rules for a type without releases that is not live-edit', () => {
    expect(
      isPerspectiveWriteable({
        selectedPerspective: 'drafts',
        isDraftModelEnabled: true,
        schemaType: getType('variantsOnly'),
      }),
    ).toEqual({result: true})
    expect(
      isPerspectiveWriteable({
        selectedPerspective: 'published',
        isDraftModelEnabled: true,
        schemaType: getType('variantsOnly'),
      }),
    ).toEqual({result: false, reason: 'PUBLISHED_NOT_WRITEABLE'})
  })
})
