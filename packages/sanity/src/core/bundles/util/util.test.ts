import {describe, expect, it} from '@jest/globals'

import {getBundleSlug, getDocumentIsInPerspective} from './util'

describe('getBundleSlug', () => {
  it('should return the bundle slug', () => {
    expect(getBundleSlug('versions.summer.my-document-id')).toBe('summer')
  })

  it('should return the PUBLISHED_SLUG if no bundle slug is found', () => {
    expect(getBundleSlug('my-document-id')).toBe('Published')
  })
})

// * - document: `summer.my-document-id`, perspective: `bundle.summer` : **true**
// * - document: `my-document-id`, perspective: `bundle.summer` : **false**
// * - document: `summer.my-document-id`perspective: `bundle.winter` : **false**
// * - document: `summer.my-document-id`, perspective: `undefined` : **false**
// * - document: `my-document-id`, perspective: `undefined` : **true**
// * - document: `drafts.my-document-id`, perspective: `undefined` : **true**

describe('getDocumentIsInPerspective', () => {
  it('should return true if document is in the current perspective', () => {
    expect(getDocumentIsInPerspective('versions.summer.my-document-id', 'bundle.summer')).toBe(true)
  })

  it('should return false if document is not a version  document a perspective is provided', () => {
    expect(getDocumentIsInPerspective('my-document-id', 'bundle.summer')).toBe(false)
  })

  it('should return false if document is not in the current perspective', () => {
    expect(getDocumentIsInPerspective('versions.summer.my-document-id', 'bundle.winter')).toBe(
      false,
    )
  })

  it('should return false if document is a version  document a no perspective is provided', () => {
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
      getDocumentIsInPerspective('versions.complex-summer.my-document-id', 'bundle.complex-summer'),
    ).toBe(true)
  })
})
