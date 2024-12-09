import {describe, expect, it, vi} from 'vitest'

import {hasSanityPackageInImportMap} from './hasSanityPackageInImportMap'

const querySelectorAllSpy = vi.spyOn(document, 'querySelectorAll')

describe('hasSanityPackageInImportMap', () => {
  it('should return false if document is undefined', () => {
    const documentSpy = vi.spyOn(global, 'document', 'get')
    documentSpy.mockReturnValueOnce(undefined as any)
    expect(hasSanityPackageInImportMap()).toBe(false)
  })
  it('should return false if no script with type importmap is found', () => {
    querySelectorAllSpy.mockReturnValue([] as any)
    expect(hasSanityPackageInImportMap()).toBe(false)
  })

  it('should return true if script with type importmap is found and contains sanity', () => {
    querySelectorAllSpy.mockReturnValue([
      {textContent: JSON.stringify({imports: {sanity: 'path/to/sanity'}})},
    ] as any)
    expect(hasSanityPackageInImportMap()).toBe(true)
  })

  it('should return false if script with type importmap is found but does not contain sanity', () => {
    querySelectorAllSpy.mockReturnValue([
      {textContent: JSON.stringify({imports: {other: 'path/to/other'}})},
    ] as any)
    expect(hasSanityPackageInImportMap()).toBe(false)
  })
})
