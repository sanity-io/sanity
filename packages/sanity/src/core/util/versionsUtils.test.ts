import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../releases/store/types'
import {isDraftVersion, isPublishedVersion, readVersionType} from './versionsUtils'

function createVersion(
  _id: string,
  system: Partial<VersionInfoDocumentStub['_system']> = {},
): VersionInfoDocumentStub {
  return {
    _id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _system: {
      group: {
        _ref: 'doc1',
        _weak: true,
      },
      ...system,
    },
  }
}

const publishedBase = createVersion('doc1')

const publishedVariant = createVersion('variant-doc', {
  variant: {_ref: '_.variants.a', _weak: true},
})

const draftBase = createVersion('drafts.doc1', {bundleId: 'drafts'})

const draftVariant = createVersion('drafts.variant-doc', {
  bundleId: 'drafts',
  variant: {
    _ref: '_.variants.a',
    _weak: true,
  },
})

const releaseVersion = createVersion('versions.a.doc1', {
  bundleId: 'bundleA',
  release: {
    _ref: '_.variants.a',
    _weak: true,
  },
})

describe('isPublishedVersion', () => {
  describe('default constraint (anyVariant)', () => {
    it('returns true for the base published version', () => {
      expect(isPublishedVersion(publishedBase)).toBe(true)
    })

    it('returns true for a published variant', () => {
      expect(isPublishedVersion(publishedVariant)).toBe(true)
    })

    it('returns false for drafts', () => {
      expect(isPublishedVersion(draftBase)).toBe(false)
      expect(isPublishedVersion(draftVariant)).toBe(false)
    })

    it('returns false for release versions', () => {
      expect(isPublishedVersion(releaseVersion)).toBe(false)
    })
  })

  describe('variant constraint', () => {
    it('returns true for a published variant matching the release id', () => {
      expect(isPublishedVersion(publishedVariant, {constraint: {variant: 'a'}})).toBe(true)
    })

    it('returns false for a published variant with a different release id', () => {
      expect(isPublishedVersion(publishedVariant, {constraint: {variant: 'b'}})).toBe(false)
    })

    it('returns false for the base published version', () => {
      expect(isPublishedVersion(publishedBase, {constraint: {variant: 'a'}})).toBe(false)
    })

    it('returns false for a draft variant matching the release id', () => {
      expect(isPublishedVersion(draftVariant, {constraint: {variant: 'a'}})).toBe(false)
    })
  })

  describe('baseVariant constraint', () => {
    it('returns true for the base published version', () => {
      expect(isPublishedVersion(publishedBase, {constraint: {baseVariant: true}})).toBe(true)
    })

    it('returns false for a published variant', () => {
      expect(isPublishedVersion(publishedVariant, {constraint: {baseVariant: true}})).toBe(false)
    })

    it('returns false for the base draft', () => {
      expect(isPublishedVersion(draftBase, {constraint: {baseVariant: true}})).toBe(false)
    })
  })
})

describe('isDraftVersion', () => {
  describe('default constraint (anyVariant)', () => {
    it('returns true for the base draft', () => {
      expect(isDraftVersion(draftBase)).toBe(true)
    })

    it('returns true for a draft variant', () => {
      expect(isDraftVersion(draftVariant)).toBe(true)
    })

    it('returns false for published versions', () => {
      expect(isDraftVersion(publishedBase)).toBe(false)
      expect(isDraftVersion(publishedVariant)).toBe(false)
    })

    it('returns false for release versions', () => {
      expect(isDraftVersion(releaseVersion)).toBe(false)
    })
  })

  describe('variant constraint', () => {
    it('returns true for a draft variant matching the release id', () => {
      expect(isDraftVersion(draftVariant, {constraint: {variant: 'a'}})).toBe(true)
    })

    it('returns false for a draft variant with a different release id', () => {
      expect(isDraftVersion(draftVariant, {constraint: {variant: 'b'}})).toBe(false)
    })

    it('returns false for the base draft', () => {
      expect(isDraftVersion(draftBase, {constraint: {variant: 'a'}})).toBe(false)
    })

    it('returns false for a published variant matching the release id', () => {
      expect(isDraftVersion(publishedVariant, {constraint: {variant: 'a'}})).toBe(false)
    })
  })

  describe('baseVariant constraint', () => {
    it('returns true for the base draft', () => {
      expect(isDraftVersion(draftBase, {constraint: {baseVariant: true}})).toBe(true)
    })

    it('returns false for a draft variant', () => {
      expect(isDraftVersion(draftVariant, {constraint: {baseVariant: true}})).toBe(false)
    })

    it('returns false for the base published version', () => {
      expect(isDraftVersion(publishedBase, {constraint: {baseVariant: true}})).toBe(false)
    })
  })
})
