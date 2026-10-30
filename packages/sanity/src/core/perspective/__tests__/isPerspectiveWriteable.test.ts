import {defineType, type ObjectSchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {
  activeASAPRelease,
  archivedScheduledRelease,
} from '../../releases/__fixtures__/release.fixture'
import {isVersionableDocumentType} from '../../releases/util/isVersionableDocumentType'
import {createSchema} from '../../schema/createSchema'
import {isPerspectiveWriteable} from '../isPerspectiveWriteable'

const schema = createSchema({
  name: 'default',
  types: [
    defineType({
      name: 'liveEditPost',
      type: 'document',
      liveEdit: true,
      fields: [{name: 'title', type: 'string'}],
    }),
  ],
})

const releaseType = schema.get('system.release') as ObjectSchemaType
const liveEditPostType = schema.get('liveEditPost') as ObjectSchemaType

describe('isVersionableDocumentType', () => {
  it('returns false for `system.release`', () => {
    expect(isVersionableDocumentType('system.release')).toBe(false)
  })

  it('returns true for other and unknown types', () => {
    expect(isVersionableDocumentType('liveEditPost')).toBe(true)
    expect(isVersionableDocumentType(undefined)).toBe(true)
  })
})

describe('isPerspectiveWriteable', () => {
  it('does not allow writing `system.release` to a release perspective', () => {
    expect(
      isPerspectiveWriteable({
        selectedPerspective: activeASAPRelease,
        isDraftModelEnabled: true,
        schemaType: releaseType,
      }),
    ).toEqual({result: false, reason: 'VERSIONS_NOT_SUPPORTED'})
  })

  it('reports `VERSIONS_NOT_SUPPORTED` before `RELEASE_NOT_ACTIVE`', () => {
    expect(
      isPerspectiveWriteable({
        selectedPerspective: archivedScheduledRelease,
        isDraftModelEnabled: true,
        schemaType: releaseType,
      }),
    ).toEqual({result: false, reason: 'VERSIONS_NOT_SUPPORTED'})
  })

  it('allows writing `system.release` to the published perspective', () => {
    expect(
      isPerspectiveWriteable({
        selectedPerspective: 'published',
        isDraftModelEnabled: true,
        schemaType: releaseType,
      }),
    ).toEqual({result: true})
  })

  it('still allows other live-edit types in a release perspective', () => {
    expect(
      isPerspectiveWriteable({
        selectedPerspective: activeASAPRelease,
        isDraftModelEnabled: true,
        schemaType: liveEditPostType,
      }),
    ).toEqual({result: true})
  })
})
