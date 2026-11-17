import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, test} from 'vitest'

import {
  activeASAPRelease,
  activeCardinalityOneRelease,
  activeScheduledRelease,
} from '../../__fixtures__/release.fixture'
import {findSharedGroups, lanesCollide} from '../releaseImpact'
import {
  countSharedGroups,
  getMemberGroupIdsByRelease,
  getOtherReleases,
} from '../releaseMemberGroups'

const metadata = (documentIds: string[]) => ({
  documentCount: documentIds.length,
  updatedAt: null,
  documentIds,
})

describe('getMemberGroupIdsByRelease', () => {
  test('reads the member group ids of the requested releases only', () => {
    const result = getMemberGroupIdsByRelease(['rA', 'rB'], {
      rA: metadata(['doc1', 'doc2']),
      rB: metadata(['doc2']),
      rC: metadata(['doc1']),
    })
    expect(result).toEqual(
      new Map([
        ['rA', ['doc1', 'doc2']],
        ['rB', ['doc2']],
      ]),
    )
  })

  test('leaves out releases whose membership has not arrived', () => {
    expect(getMemberGroupIdsByRelease(['rA', 'rB'], {rA: metadata(['doc1'])})).toEqual(
      new Map([['rA', ['doc1']]]),
    )
    expect(getMemberGroupIdsByRelease(['rA'], null)).toEqual(new Map())
  })
})

describe('shared groups across releases', () => {
  // A release and a scheduled draft share doc2; doc1 is only in one release
  const sharedGroups = findSharedGroups(
    getMemberGroupIdsByRelease(
      [activeASAPRelease._id, activeScheduledRelease._id, activeCardinalityOneRelease._id],
      {
        [activeASAPRelease._id]: metadata(['doc1', 'doc2', 'doc3']),
        [activeScheduledRelease._id]: metadata(['doc2', 'doc3']),
        [activeCardinalityOneRelease._id]: metadata(['doc2']),
      },
    ),
  )
  const releasesById = new Map<string, ReleaseDocument>(
    [activeASAPRelease, activeScheduledRelease, activeCardinalityOneRelease].map((release) => [
      release._id,
      release,
    ]),
  )

  test('counts the documents of a release that another release also contains', () => {
    expect(countSharedGroups(sharedGroups, activeASAPRelease._id)).toBe(2)
    expect(countSharedGroups(sharedGroups, activeScheduledRelease._id)).toBe(2)
    expect(countSharedGroups(sharedGroups, activeCardinalityOneRelease._id)).toBe(1)
    expect(countSharedGroups(sharedGroups, 'unknown')).toBe(0)
  })

  test('lists the other releases a document is in, scheduled drafts included', () => {
    expect(getOtherReleases(sharedGroups, releasesById, 'doc2', activeASAPRelease._id)).toEqual([
      activeScheduledRelease,
      activeCardinalityOneRelease,
    ])
    expect(getOtherReleases(sharedGroups, releasesById, 'doc1', activeASAPRelease._id)).toEqual([])
  })

  test('a release missing from the active releases is never listed', () => {
    const onlyTwo = new Map([...releasesById].filter(([id]) => id !== activeScheduledRelease._id))
    expect(getOtherReleases(sharedGroups, onlyTwo, 'doc3', activeASAPRelease._id)).toEqual([])
  })
})

describe('lanesCollide', () => {
  const version = {kind: 'release-version', versionId: 'versions.rA.doc1'} as const
  const variantA = {kind: 'variant', variantId: 'vA'} as const
  const variantB = {kind: 'variant', variantId: 'vB'} as const
  const defaultDraft = {kind: 'default-draft'} as const

  test("today's members always collide", () => {
    expect(lanesCollide(version, version)).toBe(true)
    expect(lanesCollide(version, variantA)).toBe(true)
  })

  test('an unknown lane collides', () => {
    expect(lanesCollide(undefined, variantA)).toBe(true)
    expect(lanesCollide(undefined, undefined)).toBe(true)
  })

  test('different lanes of one group do not collide in the planned model', () => {
    expect(lanesCollide(variantA, variantB)).toBe(false)
    expect(lanesCollide(variantA, defaultDraft)).toBe(false)
    expect(lanesCollide(defaultDraft, variantB)).toBe(false)
  })

  test('the same lane collides', () => {
    expect(lanesCollide(variantA, {kind: 'variant', variantId: 'vA'})).toBe(true)
    expect(lanesCollide(defaultDraft, defaultDraft)).toBe(true)
  })
})
