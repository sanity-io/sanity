import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {activeScheduledRelease} from '../__fixtures__/release.fixture'
import {getDocumentIsInPerspective, shouldShowReleaseInView} from './util'

// * - document: `summer.my-document-id`, perspective: `rsummer` : **true**
// * - document: `my-document-id`, perspective: `rsummer` : **false**
// * - document: `summer.my-document-id`perspective: `rwinter` : **false**
// * - document: `summer.my-document-id`, perspective: `undefined` : **false**
// * - document: `my-document-id`, perspective: `undefined` : **true**
// * - document: `drafts.my-document-id`, perspective: `undefined` : **true**

describe('getDocumentIsInPerspective', () => {
  it('should return true if document is in the current perspective', () => {
    expect(getDocumentIsInPerspective('versions.rsummer.my-document-id', 'rsummer')).toBe(true)
  })

  it('should return false if document is not a version  document a perspective is provided', () => {
    expect(getDocumentIsInPerspective('my-document-id', 'rsummer')).toBe(false)
  })

  it('should return false if document is not in the current perspective', () => {
    expect(getDocumentIsInPerspective('versions.summer.my-document-id', 'rwinter')).toBe(false)
  })

  it('should return false if document is a version document a no perspective is provided', () => {
    expect(getDocumentIsInPerspective('versions.summer.my-document-id', undefined)).toBe(false)
  })

  it("should return true if the document is in the 'Published' perspective, and no perspective is provided", () => {
    expect(getDocumentIsInPerspective('my-document-id', undefined)).toBe(true)
  })
  it("should return true if the document is a draft document in the 'Published' perspective, and no perspective is provided", () => {
    expect(getDocumentIsInPerspective('drafts.my-document-id', undefined)).toBe(true)
  })

  it('should handle complex document ids correctly', () => {
    expect(
      getDocumentIsInPerspective('versions.rcomplex-summer.my-document-id', 'rcomplex-summer'),
    ).toBe(true)
  })
})

describe('shouldShowReleaseInView', () => {
  it('should show cardinality "many" releases in "releases" view', () => {
    const release: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: 'many',
      },
    }
    const filterFn = shouldShowReleaseInView('releases')
    expect(filterFn(release)).toBe(true)
  })

  it('should show undefined cardinality releases in "releases" view', () => {
    const release: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: undefined,
      },
    }
    const filterFn = shouldShowReleaseInView('releases')
    expect(filterFn(release)).toBe(true)
  })

  it('should show cardinality "one" releases in "drafts" view', () => {
    const release: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: 'one',
      },
    }
    const filterFn = shouldShowReleaseInView('drafts')
    expect(filterFn(release)).toBe(true)
  })

  it('should not show cardinality "one" releases in "releases" view', () => {
    const release: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: 'one',
      },
    }
    const filterFn = shouldShowReleaseInView('releases')
    expect(filterFn(release)).toBe(false)
  })

  it('should not show cardinality "many" releases in "drafts" view', () => {
    const release: ReleaseDocument = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: 'many',
      },
    }
    const filterFn = shouldShowReleaseInView('drafts')
    expect(filterFn(release)).toBe(false)
  })
})
