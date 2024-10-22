import {describe, expect, it} from 'vitest'

import {getDocumentIsInPerspective} from './util'

// * - document: `summer.my-document-id`, perspective: `release.summer` : **true**
// * - document: `my-document-id`, perspective: `release.summer` : **false**
// * - document: `summer.my-document-id`perspective: `release.winter` : **false**
// * - document: `summer.my-document-id`, perspective: `undefined` : **false**
// * - document: `my-document-id`, perspective: `undefined` : **true**
// * - document: `drafts.my-document-id`, perspective: `undefined` : **true**

describe('getDocumentIsInPerspective', () => {
  it('should return true if document is in the current perspective', () => {
    expect(getDocumentIsInPerspective('versions.summer.my-document-id', 'release.summer')).toBe(
      true,
    )
  })

  it('should return false if document is not a version  document a perspective is provided', () => {
    expect(getDocumentIsInPerspective('my-document-id', 'release.summer')).toBe(false)
  })

  it('should return false if document is not in the current perspective', () => {
    expect(getDocumentIsInPerspective('versions.summer.my-document-id', 'release.winter')).toBe(
      false,
    )
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
      getDocumentIsInPerspective(
        'versions.complex-summer.my-document-id',
        'release.complex-summer',
      ),
    ).toBe(true)
  })
})
