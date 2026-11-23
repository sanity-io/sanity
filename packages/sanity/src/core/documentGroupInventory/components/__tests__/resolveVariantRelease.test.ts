import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {scheduledRelease} from '../../../releases/__fixtures__/release.fixture'
import {type Variant} from '../../machines/selectionMachine'
import {resolveVariantRelease} from '../DocumentGroupEntry'

const RELEASES = new Map<string, ReleaseDocument>([[scheduledRelease._id, scheduledRelease]])

function row(id: string, system: Partial<Variant['document']['_system']> = {}): Variant {
  return {
    id,
    name: id,
    document: {
      _id: id,
      _rev: 'rev',
      _createdAt: '2026-01-01T00:00:00Z',
      _updatedAt: '2026-01-01T00:00:00Z',
      _type: 'book',
      _system: {group: {_ref: 'book', _weak: true}, ...system},
    },
  }
}

describe('resolveVariantRelease', () => {
  it('finds a variant release from _system.release', () => {
    const variant = row('versions.scope.book', {release: {_ref: scheduledRelease._id, _weak: true}})
    expect(resolveVariantRelease(variant, RELEASES)).toBe(scheduledRelease)
  })

  it('finds a plain release version (the single list with variants off) from its id', () => {
    expect(resolveVariantRelease(row(`versions.${scheduledRelease.name}.book`), RELEASES)).toBe(
      scheduledRelease,
    )
  })

  it('finds none for drafts and published', () => {
    expect(resolveVariantRelease(row('drafts.book'), RELEASES)).toBeUndefined()
    expect(resolveVariantRelease(row('book'), RELEASES)).toBeUndefined()
  })
})
