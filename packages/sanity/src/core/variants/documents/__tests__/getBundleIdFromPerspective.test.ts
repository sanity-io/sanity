import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {RELEASE_DOCUMENT_TYPE} from '../../../releases/store/constants'
import {getBundleIdFromPerspective} from '../getBundleIdFromPerspective'

const releaseDocument: ReleaseDocument = {
  _id: '_.releases.rSummer123',
  name: 'rSummer123',
  _type: RELEASE_DOCUMENT_TYPE,
  _rev: 'rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  state: 'active',
  metadata: {
    title: 'Summer',
    releaseType: 'asap',
  },
}

describe('getBundleIdFromPerspective', () => {
  it('maps drafts perspective to drafts bundle', () => {
    expect(getBundleIdFromPerspective('drafts')).toBe('drafts')
  })

  it('maps published perspective to published bundle', () => {
    expect(getBundleIdFromPerspective('published')).toBe('published')
  })

  it('maps release document to release id', () => {
    expect(getBundleIdFromPerspective(releaseDocument)).toBe('rSummer123')
  })

  it('maps anonymous bundle string to bundle id', () => {
    expect(getBundleIdFromPerspective('my-bundle')).toBe('my-bundle')
  })
})
