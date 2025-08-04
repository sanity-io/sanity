import {describe, expect, it, vi} from 'vitest'

import {getSanityImportMapUrl, hasSanityPackageInImportMap} from './importMap'

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

describe('getSanityImportMapUrl', () => {
  it('should return undefined if there is no document', () => {
    const documentSpy = vi.spyOn(global, 'document', 'get')
    documentSpy.mockReturnValueOnce(undefined as any)
    expect(getSanityImportMapUrl()).toBeUndefined()
  })
  it('should return undefined if no script with type importmap is found', () => {
    querySelectorAllSpy.mockReturnValue([] as any)
    expect(getSanityImportMapUrl()).toBeUndefined()
  })

  it('should return the url from the sanity package in the import map, when it exists', () => {
    querySelectorAllSpy.mockReturnValue([
      {textContent: JSON.stringify({imports: {sanity: 'path/to/sanity'}})},
    ] as any)
    expect(getSanityImportMapUrl()).toBe('path/to/sanity')
  })

  it('should return undefined if script with type importmap is found but does not contain sanity', () => {
    querySelectorAllSpy.mockReturnValue([
      {textContent: JSON.stringify({imports: {other: 'path/to/other'}})},
    ] as any)
    expect(getSanityImportMapUrl()).toBeUndefined()
  })
})
