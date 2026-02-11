import {type AssetSource, type SchemaType} from '@sanity/types'
import {describe, expect, it, vi} from 'vitest'

import {type FormBuilderContextValue} from '../../../FormBuilderContext'
import {resolveUploadAssetSources} from '../resolveUploadAssetSources'

describe('resolveUploadAssetSources', () => {
  class MockUploader {
    upload = vi.fn()
  }

  const mockAssetSourceWithUploader: AssetSource = {
    name: 'source-with-uploader',
    title: 'Source With Uploader',
    component: vi.fn(),
    Uploader: MockUploader,
  }

  const mockAssetSourceWithoutUploader: AssetSource = {
    name: 'source-without-uploader',
    title: 'Source Without Uploader',
    component: vi.fn(),
  }

  const createMockFormBuilder = (
    imageDirectUploads: boolean,
    imageAssetSources: AssetSource[],
    fileDirectUploads: boolean,
    fileAssetSources: AssetSource[],
  ): FormBuilderContextValue => {
    return {
      __internal: {
        image: {
          directUploads: imageDirectUploads,
          assetSources: imageAssetSources,
        },
        file: {
          directUploads: fileDirectUploads,
          assetSources: fileAssetSources,
        },
      },
    } as unknown as FormBuilderContextValue
  }

  const createMockImageType = (accept?: string): SchemaType => {
    return {
      name: 'image',
      type: {name: 'image', type: null, jsonType: 'object'},
      jsonType: 'object',
      options: accept ? {accept} : undefined,
    } as unknown as SchemaType
  }

  const createMockFileType = (accept?: string): SchemaType => {
    return {
      name: 'file',
      type: {name: 'file', type: null, jsonType: 'object'},
      jsonType: 'object',
      options: accept ? {accept} : undefined,
    } as unknown as SchemaType
  }

  const createMockFile = (name: string, type: string): File => new File(['content'], name, {type})

  describe('Type Resolution', () => {
    it('returns asset sources for image type', () => {
      const formBuilder = createMockFormBuilder(true, [mockAssetSourceWithUploader], false, [])
      const imageType = createMockImageType()

      const result = resolveUploadAssetSources(imageType, formBuilder)

      expect(result).toHaveLength(1)
      expect(result[0]).toBe(mockAssetSourceWithUploader)
    })

    it('returns asset sources for file type', () => {
      const formBuilder = createMockFormBuilder(false, [], true, [mockAssetSourceWithUploader])
      const fileType = createMockFileType()

      const result = resolveUploadAssetSources(fileType, formBuilder)

      expect(result).toHaveLength(1)
      expect(result[0]).toBe(mockAssetSourceWithUploader)
    })

    it('returns empty array for non-file/image types', () => {
      const formBuilder = createMockFormBuilder(true, [mockAssetSourceWithUploader], true, [
        mockAssetSourceWithUploader,
      ])
      const stringType: SchemaType = {
        name: 'string',
        type: {name: 'string', type: null, jsonType: 'string'},
        jsonType: 'string',
      } as unknown as SchemaType

      const result = resolveUploadAssetSources(stringType, formBuilder)

      expect(result).toEqual([])
    })

    it('handles inherited image types', () => {
      const formBuilder = createMockFormBuilder(true, [mockAssetSourceWithUploader], false, [])
      const customImageType: SchemaType = {
        name: 'customImage',
        type: {name: 'image', type: null, jsonType: 'object'},
        jsonType: 'object',
      } as unknown as SchemaType

      const result = resolveUploadAssetSources(customImageType, formBuilder)

      expect(result).toHaveLength(1)
      expect(result[0]).toBe(mockAssetSourceWithUploader)
    })

    it('handles inherited file types', () => {
      const formBuilder = createMockFormBuilder(false, [], true, [mockAssetSourceWithUploader])
      const customFileType: SchemaType = {
        name: 'customFile',
        type: {name: 'file', type: null, jsonType: 'object'},
        jsonType: 'object',
      } as unknown as SchemaType

      const result = resolveUploadAssetSources(customFileType, formBuilder)

      expect(result).toHaveLength(1)
      expect(result[0]).toBe(mockAssetSourceWithUploader)
    })
  })

  describe('Upload Support Flags', () => {
    it('returns empty array when directImageUploads is false', () => {
      const formBuilder = createMockFormBuilder(false, [mockAssetSourceWithUploader], true, [])
      const imageType = createMockImageType()

      const result = resolveUploadAssetSources(imageType, formBuilder)

      expect(result).toEqual([])
    })

    it('returns empty array when directFileUploads is false', () => {
      const formBuilder = createMockFormBuilder(false, [], false, [mockAssetSourceWithUploader])
      const fileType = createMockFileType()

      const result = resolveUploadAssetSources(fileType, formBuilder)

      expect(result).toEqual([])
    })

    it('respects formBuilder configuration for each type independently', () => {
      const formBuilder = createMockFormBuilder(true, [mockAssetSourceWithUploader], false, [
        mockAssetSourceWithUploader,
      ])
      const imageType = createMockImageType()
      const fileType = createMockFileType()

      const imageResult = resolveUploadAssetSources(imageType, formBuilder)
      const fileResult = resolveUploadAssetSources(fileType, formBuilder)

      expect(imageResult).toHaveLength(1)
      expect(fileResult).toEqual([])
    })
  })

  describe('File Filtering with Accept Patterns', () => {
    it('filters files that do not match image accept pattern (e.g., image/png only)', () => {
      const formBuilder = createMockFormBuilder(true, [mockAssetSourceWithUploader], false, [])
      const imageType = createMockImageType('image/png')
      const jpegFile = createMockFile('test.jpg', 'image/jpeg')

      const result = resolveUploadAssetSources(imageType, formBuilder, jpegFile)

      expect(result).toEqual([])
    })

    it('returns sources when file matches image accept pattern', () => {
      const formBuilder = createMockFormBuilder(true, [mockAssetSourceWithUploader], false, [])
      const imageType = createMockImageType('image/png')
      const pngFile = createMockFile('test.png', 'image/png')

      const result = resolveUploadAssetSources(imageType, formBuilder, pngFile)

      expect(result).toHaveLength(1)
      expect(result[0]).toBe(mockAssetSourceWithUploader)
    })

    it('filters files that do not match file accept pattern', () => {
      const formBuilder = createMockFormBuilder(false, [], true, [mockAssetSourceWithUploader])
      const fileType = createMockFileType('application/pdf')
      const zipFile = createMockFile('test.zip', 'application/zip')

      const result = resolveUploadAssetSources(fileType, formBuilder, zipFile)

      expect(result).toEqual([])
    })

    it('returns sources when file matches file accept pattern', () => {
      const formBuilder = createMockFormBuilder(false, [], true, [mockAssetSourceWithUploader])
      const fileType = createMockFileType('application/pdf')
      const pdfFile = createMockFile('test.pdf', 'application/pdf')

      const result = resolveUploadAssetSources(fileType, formBuilder, pdfFile)

      expect(result).toHaveLength(1)
      expect(result[0]).toBe(mockAssetSourceWithUploader)
    })

    it('ignores file validation when no file provided (for hover scenarios)', () => {
      const formBuilder = createMockFormBuilder(true, [mockAssetSourceWithUploader], false, [])
      const imageType = createMockImageType('image/png')

      const result = resolveUploadAssetSources(imageType, formBuilder)

      expect(result).toHaveLength(1)
      expect(result[0]).toBe(mockAssetSourceWithUploader)
    })

    it('uses default accept pattern image/* when image type has no accept option', () => {
      const formBuilder = createMockFormBuilder(true, [mockAssetSourceWithUploader], false, [])
      const imageType = createMockImageType()
      const jpegFile = createMockFile('test.jpg', 'image/jpeg')

      const result = resolveUploadAssetSources(imageType, formBuilder, jpegFile)

      expect(result).toHaveLength(1)
      expect(result[0]).toBe(mockAssetSourceWithUploader)
    })

    it('uses empty accept pattern for file types when no accept option', () => {
      const formBuilder = createMockFormBuilder(false, [], true, [mockAssetSourceWithUploader])
      const fileType = createMockFileType()
      const pdfFile = createMockFile('test.pdf', 'application/pdf')

      const result = resolveUploadAssetSources(fileType, formBuilder, pdfFile)

      expect(result).toHaveLength(1)
      expect(result[0]).toBe(mockAssetSourceWithUploader)
    })

    it('accepts wildcard mime types', () => {
      const formBuilder = createMockFormBuilder(true, [mockAssetSourceWithUploader], false, [])
      const imageType = createMockImageType('image/*')
      const jpegFile = createMockFile('test.jpg', 'image/jpeg')
      const pngFile = createMockFile('test.png', 'image/png')

      const jpegResult = resolveUploadAssetSources(imageType, formBuilder, jpegFile)
      const pngResult = resolveUploadAssetSources(imageType, formBuilder, pngFile)

      expect(jpegResult).toHaveLength(1)
      expect(pngResult).toHaveLength(1)
    })
  })

  describe('Fallback Behavior', () => {
    it('returns sources with Uploaders when available', () => {
      const formBuilder = createMockFormBuilder(
        true,
        [mockAssetSourceWithUploader, mockAssetSourceWithoutUploader],
        false,
        [],
      )
      const imageType = createMockImageType()

      const result = resolveUploadAssetSources(imageType, formBuilder)

      expect(result).toHaveLength(1)
      expect(result[0]).toBe(mockAssetSourceWithUploader)
    })

    it('returns all sources when none have Uploaders (plugin fallback)', () => {
      const formBuilder = createMockFormBuilder(true, [mockAssetSourceWithoutUploader], false, [])
      const imageType = createMockImageType()

      const result = resolveUploadAssetSources(imageType, formBuilder)

      expect(result).toHaveLength(1)
      expect(result[0]).toBe(mockAssetSourceWithoutUploader)
    })

    it('handles mixed sources (some with, some without Uploaders)', () => {
      class AnotherMockUploader {
        upload = vi.fn()
      }

      const anotherSourceWithUploader: AssetSource = {
        name: 'another-source-with-uploader',
        title: 'Another Source With Uploader',
        component: vi.fn(),
        Uploader: AnotherMockUploader,
      }

      const formBuilder = createMockFormBuilder(
        true,
        [mockAssetSourceWithUploader, mockAssetSourceWithoutUploader, anotherSourceWithUploader],
        false,
        [],
      )
      const imageType = createMockImageType()

      const result = resolveUploadAssetSources(imageType, formBuilder)

      expect(result).toHaveLength(2)
      expect(result).toContain(mockAssetSourceWithUploader)
      expect(result).toContain(anotherSourceWithUploader)
      expect(result).not.toContain(mockAssetSourceWithoutUploader)
    })

    it('returns empty array when no sources are configured', () => {
      const formBuilder = createMockFormBuilder(true, [], false, [])
      const imageType = createMockImageType()

      const result = resolveUploadAssetSources(imageType, formBuilder)

      expect(result).toEqual([])
    })
  })

  describe('Edge Cases', () => {
    it('handles multiple accept patterns separated by commas', () => {
      const formBuilder = createMockFormBuilder(true, [mockAssetSourceWithUploader], false, [])
      const imageType = createMockImageType('image/png,image/jpeg')
      const jpegFile = createMockFile('test.jpg', 'image/jpeg')
      const pngFile = createMockFile('test.png', 'image/png')
      const gifFile = createMockFile('test.gif', 'image/gif')

      const jpegResult = resolveUploadAssetSources(imageType, formBuilder, jpegFile)
      const pngResult = resolveUploadAssetSources(imageType, formBuilder, pngFile)
      const gifResult = resolveUploadAssetSources(imageType, formBuilder, gifFile)

      expect(jpegResult).toHaveLength(1)
      expect(pngResult).toHaveLength(1)
      expect(gifResult).toEqual([])
    })

    it('handles file extension patterns in accept', () => {
      const formBuilder = createMockFormBuilder(false, [], true, [mockAssetSourceWithUploader])
      const fileType = createMockFileType('.pdf,.doc')
      const pdfFile = createMockFile('test.pdf', 'application/pdf')
      const docFile = createMockFile('test.doc', 'application/msword')

      const pdfResult = resolveUploadAssetSources(fileType, formBuilder, pdfFile)
      const docResult = resolveUploadAssetSources(fileType, formBuilder, docFile)

      expect(pdfResult).toHaveLength(1)
      expect(docResult).toHaveLength(1)
    })

    it('returns empty array when directUploads is false even if accept pattern matches', () => {
      const formBuilder = createMockFormBuilder(false, [mockAssetSourceWithUploader], false, [])
      const imageType = createMockImageType('image/png')
      const pngFile = createMockFile('test.png', 'image/png')

      const result = resolveUploadAssetSources(imageType, formBuilder, pngFile)

      expect(result).toEqual([])
    })
  })
})
