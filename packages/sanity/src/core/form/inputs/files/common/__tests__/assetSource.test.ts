import {type AssetFromSource, type FileSchemaType, type ImageSchemaType} from '@sanity/types'
import {describe, expect, it, vi} from 'vitest'

import {type VideoSchemaType} from '../../../../../../media-library/plugin/schemas/types'
import {base64ToFile, urlToFile} from '../../ImageInput/utils/image'
import {handleSelectAssetFromSource} from '../assetSource'

vi.mock('../../ImageInput/utils/image', () => ({
  base64ToFile: vi.fn().mockResolvedValue(new File(['content'], 'test.png', {type: 'image/png'})),
  urlToFile: vi.fn().mockResolvedValue(new File(['content'], 'test.png', {type: 'image/png'})),
}))

const createFileType = (): FileSchemaType =>
  ({name: 'file', type: {name: 'file'}, jsonType: 'object'}) as unknown as FileSchemaType

const createImageType = (): ImageSchemaType =>
  ({name: 'image', type: {name: 'image'}, jsonType: 'object'}) as unknown as ImageSchemaType

const createVideoType = (): VideoSchemaType =>
  ({
    name: 'sanity.video',
    type: {name: 'sanity.video'},
    jsonType: 'object',
  }) as unknown as VideoSchemaType

describe('handleSelectAssetFromSource', () => {
  it('throws when assetsFromSource is null or undefined', () => {
    const onChange = vi.fn()
    const type = createFileType()

    expect(() =>
      handleSelectAssetFromSource({
        assetsFromSource: null as any,
        onChange,
        type,
        resolveUploader: () => null,
      }),
    ).toThrow('No asset given')

    expect(() =>
      handleSelectAssetFromSource({
        assetsFromSource: undefined as any,
        onChange,
        type,
        resolveUploader: () => null,
      }),
    ).toThrow('No asset given')
  })

  it('throws when assetsFromSource is empty array or not an array', () => {
    const onChange = vi.fn()
    const type = createFileType()

    expect(() =>
      handleSelectAssetFromSource({
        assetsFromSource: [],
        onChange,
        type,
        resolveUploader: () => null,
      }),
    ).toThrow('Returned value must be an array with at least one item (asset)')

    expect(() =>
      handleSelectAssetFromSource({
        assetsFromSource: 'not-array' as any,
        onChange,
        type,
        resolveUploader: () => null,
      }),
    ).toThrow('Returned value must be an array with at least one item (asset)')
  })

  describe("kind: 'assetDocumentId'", () => {
    it('calls onChange with correct patches for file type', () => {
      const onChange = vi.fn()
      const type = createFileType()

      handleSelectAssetFromSource({
        assetsFromSource: [{kind: 'assetDocumentId', value: 'file-asset-123'}],
        onChange,
        type,
        resolveUploader: () => null,
      })

      expect(onChange).toHaveBeenCalledTimes(1)
      const patches = onChange.mock.calls[0][0]
      expect(Array.isArray(patches)).toBe(true)
      expect(patches).toContainEqual(
        expect.objectContaining({
          type: 'setIfMissing',
          value: {_type: 'file'},
        }),
      )
      expect(patches).toContainEqual(
        expect.objectContaining({
          path: ['asset'],
          value: {_type: 'reference', _ref: 'file-asset-123'},
        }),
      )
    })

    it('calls onChange with correct patches for image type including hotspot and crop unset', () => {
      const onChange = vi.fn()
      const type = createImageType()

      handleSelectAssetFromSource({
        assetsFromSource: [{kind: 'assetDocumentId', value: 'image-asset-456'}],
        onChange,
        type,
        resolveUploader: () => null,
      })

      expect(onChange).toHaveBeenCalledTimes(1)
      const patches = onChange.mock.calls[0][0]
      expect(patches).toContainEqual(
        expect.objectContaining({
          type: 'unset',
          path: ['hotspot'],
        }),
      )
      expect(patches).toContainEqual(
        expect.objectContaining({
          type: 'unset',
          path: ['crop'],
        }),
      )
      expect(patches).toContainEqual(
        expect.objectContaining({
          type: 'unset',
          path: ['media'],
        }),
      )
      expect(patches).toContainEqual(
        expect.objectContaining({
          path: ['asset'],
          value: {_type: 'reference', _ref: 'image-asset-456'},
        }),
      )
    })

    it('calls onChange with media unset for file type (no hotspot/crop)', () => {
      const onChange = vi.fn()
      const type = createFileType()

      handleSelectAssetFromSource({
        assetsFromSource: [{kind: 'assetDocumentId', value: 'file-asset-789'}],
        onChange,
        type,
        resolveUploader: () => null,
      })

      const patches = onChange.mock.calls[0][0]
      expect(patches).toContainEqual(
        expect.objectContaining({
          type: 'unset',
          path: ['media'],
        }),
      )
      expect(patches).not.toContainEqual(
        expect.objectContaining({
          type: 'unset',
          path: ['hotspot'],
        }),
      )
    })
  })

  describe('mediaLibraryProps', () => {
    it('sets media ref and asset instance ref for video type', () => {
      const onChange = vi.fn()
      const type = createVideoType()

      handleSelectAssetFromSource({
        assetsFromSource: [
          {
            kind: 'assetDocumentId',
            value: 'ref',
            mediaLibraryProps: {
              mediaLibraryId: 'ml-123',
              assetId: 'asset-abc',
              assetInstanceId: 'instance-xyz',
            },
          },
        ],
        onChange,
        type,
        resolveUploader: () => null,
      })

      expect(onChange).toHaveBeenCalledTimes(1)
      const patches = onChange.mock.calls[0][0]
      expect(patches).toContainEqual(
        expect.objectContaining({
          path: ['media'],
          value: {
            _type: 'globalDocumentReference',
            _ref: 'media-library:ml-123:asset-abc',
            _weak: true,
          },
        }),
      )
      expect(patches).toContainEqual(
        expect.objectContaining({
          path: ['asset'],
          value: {
            _type: 'globalDocumentReference',
            _ref: 'media-library:ml-123:instance-xyz',
            _weak: true,
          },
        }),
      )
    })

    it('sets media ref for image type with mediaLibraryProps', () => {
      const onChange = vi.fn()
      const type = createImageType()

      handleSelectAssetFromSource({
        assetsFromSource: [
          {
            kind: 'assetDocumentId',
            value: 'image-ref-999',
            mediaLibraryProps: {
              mediaLibraryId: 'ml-456',
              assetId: 'asset-def',
              assetInstanceId: 'instance-def',
            },
          },
        ],
        onChange,
        type,
        resolveUploader: () => null,
      })

      expect(onChange).toHaveBeenCalledTimes(1)
      const patches = onChange.mock.calls[0][0]
      expect(patches).toContainEqual(
        expect.objectContaining({
          path: ['media'],
          value: {
            _type: 'globalDocumentReference',
            _ref: 'media-library:ml-456:asset-def',
            _weak: true,
          },
        }),
      )
      expect(patches).toContainEqual(
        expect.objectContaining({
          path: ['asset'],
          value: {_type: 'reference', _ref: 'image-ref-999'},
        }),
      )
    })
  })

  describe("kind: 'file'", () => {
    it('resolves uploader and calls uploadWith when uploader exists', () => {
      const onChange = vi.fn()
      const uploadWith = vi.fn()
      const mockUploader = {upload: vi.fn()}
      const resolveUploader = vi.fn().mockReturnValue(mockUploader)
      const file = new File(['content'], 'test.pdf', {type: 'application/pdf'})
      const type = createFileType()

      handleSelectAssetFromSource({
        // @ts-expect-error - DOM File; @sanity/types has a conflicting File interface
        assetsFromSource: [{kind: 'file', value: file}],
        onChange,
        type,
        resolveUploader,
        uploadWith,
      })

      expect(resolveUploader).toHaveBeenCalledWith(type, file)
      expect(uploadWith).toHaveBeenCalledWith(mockUploader, file, {})
    })

    it('does not call uploadWith when uploader is null', () => {
      const uploadWith = vi.fn()
      const resolveUploader = vi.fn().mockReturnValue(null)
      const file = new File(['content'], 'test.pdf', {type: 'application/pdf'})
      const type = createFileType()

      handleSelectAssetFromSource({
        // @ts-expect-error - DOM File; @sanity/types has a conflicting File interface
        assetsFromSource: [{kind: 'file', value: file}],
        onChange: vi.fn(),
        type,
        resolveUploader,
        uploadWith,
      })

      expect(uploadWith).not.toHaveBeenCalled()
    })

    it('passes assetDocumentProps to uploadWith', () => {
      const uploadWith = vi.fn()
      const mockUploader = {}
      const resolveUploader = vi.fn().mockReturnValue(mockUploader)
      const file = new File(['content'], 'test.pdf', {type: 'application/pdf'})
      const type = createFileType()

      handleSelectAssetFromSource({
        assetsFromSource: [
          {
            kind: 'file',
            // @ts-expect-error - DOM File; @sanity/types has a conflicting File interface
            value: file,
            assetDocumentProps: {
              title: 'My Title',
              description: 'My Desc',
              originalFilename: 'original.pdf',
            } as NonNullable<AssetFromSource['assetDocumentProps']>,
          },
        ],
        onChange: vi.fn(),
        type,
        resolveUploader,
        uploadWith,
      })

      expect(uploadWith).toHaveBeenCalledWith(
        mockUploader,
        file,
        expect.objectContaining({
          title: 'My Title',
          description: 'My Desc',
        }),
      )
    })
  })

  describe("kind: 'base64'", () => {
    it('converts base64 to file and calls uploadWith', async () => {
      const uploadWith = vi.fn()
      const mockUploader = {}
      const resolveUploader = vi.fn().mockReturnValue(mockUploader)
      const type = createFileType()

      handleSelectAssetFromSource({
        assetsFromSource: [
          {
            kind: 'base64',
            value: 'data:image/png;base64,iVBORw0KGgo=',
            assetDocumentProps: {
              originalFilename: 'custom.png',
            } as NonNullable<AssetFromSource['assetDocumentProps']>,
          },
        ],
        onChange: vi.fn(),
        type,
        resolveUploader,
        uploadWith,
      })

      expect(base64ToFile).toHaveBeenCalledWith('data:image/png;base64,iVBORw0KGgo=', 'custom.png')

      await vi.waitFor(() => {
        expect(uploadWith).toHaveBeenCalled()
      })

      expect(uploadWith).toHaveBeenCalledWith(
        mockUploader,
        expect.any(File),
        expect.objectContaining({}),
      )
    })
  })

  describe("kind: 'url'", () => {
    it('converts url to file and calls uploadWith', async () => {
      const uploadWith = vi.fn()
      const mockUploader = {}
      const resolveUploader = vi.fn().mockReturnValue(mockUploader)
      const type = createFileType()

      handleSelectAssetFromSource({
        assetsFromSource: [
          {
            kind: 'url',
            value: 'https://example.com/image.png',
            assetDocumentProps: {
              originalFilename: 'from-url.png',
            } as NonNullable<AssetFromSource['assetDocumentProps']>,
          },
        ],
        onChange: vi.fn(),
        type,
        resolveUploader,
        uploadWith,
      })

      expect(urlToFile).toHaveBeenCalledWith('https://example.com/image.png', 'from-url.png')

      await vi.waitFor(() => {
        expect(uploadWith).toHaveBeenCalled()
      })

      expect(uploadWith).toHaveBeenCalledWith(
        mockUploader,
        expect.any(File),
        expect.objectContaining({}),
      )
    })
  })

  it('throws for invalid kind', () => {
    const onChange = vi.fn()
    const type = createFileType()

    expect(() =>
      handleSelectAssetFromSource({
        assetsFromSource: [{kind: 'invalid' as any, value: 'x'}],
        onChange,
        type,
        resolveUploader: () => null,
      }),
    ).toThrow('Invalid value returned from asset source plugin')
  })
})
