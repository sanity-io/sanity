import {type SchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {findMatchingSchemaType, matchesSchemaTypeAccept} from '../matchSchemaTypeAccept'

const createMockSchemaType = (name: string, options?: {accept?: string}): SchemaType =>
  ({
    name,
    type: {name, type: null, jsonType: 'object'},
    jsonType: 'object',
    options,
  }) as unknown as SchemaType

const createFileLike = (type: string, name?: string) => ({type, name: name ?? 'test'})

describe('matchSchemaTypeAccept', () => {
  describe('matchesSchemaTypeAccept', () => {
    it('accepts image/* when schema has no accept option', () => {
      const schemaType = createMockSchemaType('image')
      expect(matchesSchemaTypeAccept(createFileLike('image/jpeg'), schemaType, 'image')).toBe(true)
      expect(matchesSchemaTypeAccept(createFileLike('image/png'), schemaType, 'image')).toBe(true)
      expect(matchesSchemaTypeAccept(createFileLike('image/webp'), schemaType, 'image')).toBe(true)
    })

    it('rejects non-image MIME when schema is image type', () => {
      const schemaType = createMockSchemaType('image')
      expect(matchesSchemaTypeAccept(createFileLike('video/mp4'), schemaType, 'image')).toBe(false)
      expect(matchesSchemaTypeAccept(createFileLike('application/pdf'), schemaType, 'image')).toBe(
        false,
      )
    })

    it('respects schema options.accept for image', () => {
      const schemaType = createMockSchemaType('image', {accept: 'image/png,image/jpeg'})
      expect(matchesSchemaTypeAccept(createFileLike('image/png'), schemaType, 'image')).toBe(true)
      expect(matchesSchemaTypeAccept(createFileLike('image/jpeg'), schemaType, 'image')).toBe(true)
      expect(matchesSchemaTypeAccept(createFileLike('image/webp'), schemaType, 'image')).toBe(false)
      expect(matchesSchemaTypeAccept(createFileLike('image/gif'), schemaType, 'image')).toBe(false)
    })

    it('accepts any file when schema is file type with no accept', () => {
      const schemaType = createMockSchemaType('file')
      expect(matchesSchemaTypeAccept(createFileLike('application/pdf'), schemaType, 'file')).toBe(
        true,
      )
      expect(matchesSchemaTypeAccept(createFileLike('text/plain'), schemaType, 'file')).toBe(true)
      expect(matchesSchemaTypeAccept(createFileLike('video/mp4'), schemaType, 'file')).toBe(true)
    })

    it('respects schema options.accept for file', () => {
      const schemaType = createMockSchemaType('file', {accept: 'application/pdf'})
      expect(matchesSchemaTypeAccept(createFileLike('application/pdf'), schemaType, 'file')).toBe(
        true,
      )
      expect(matchesSchemaTypeAccept(createFileLike('text/plain'), schemaType, 'file')).toBe(false)
    })

    it('accepts video/* when schema has no accept option (video type)', () => {
      const schemaType = createMockSchemaType('sanity.video')
      expect(matchesSchemaTypeAccept(createFileLike('video/mp4'), schemaType, 'video')).toBe(true)
      expect(matchesSchemaTypeAccept(createFileLike('video/webm'), schemaType, 'video')).toBe(true)
    })

    it('rejects non-video MIME when schema is video type', () => {
      const schemaType = createMockSchemaType('sanity.video')
      expect(matchesSchemaTypeAccept(createFileLike('image/jpeg'), schemaType, 'video')).toBe(false)
      expect(matchesSchemaTypeAccept(createFileLike('application/pdf'), schemaType, 'video')).toBe(
        false,
      )
    })

    it('respects schema options.accept for video (e.g. video/mp4 only)', () => {
      const schemaType = createMockSchemaType('sanity.video', {accept: 'video/mp4'})
      expect(matchesSchemaTypeAccept(createFileLike('video/mp4'), schemaType, 'video')).toBe(true)
      expect(matchesSchemaTypeAccept(createFileLike('video/webm'), schemaType, 'video')).toBe(false)
      expect(matchesSchemaTypeAccept(createFileLike('video/ogg'), schemaType, 'video')).toBe(false)
    })
  })

  describe('findMatchingSchemaType', () => {
    it('returns image type for image file when types include image', () => {
      const imageType = createMockSchemaType('image')
      const types: SchemaType[] = [imageType]
      const result = findMatchingSchemaType(createFileLike('image/jpeg'), types)
      expect(result).toEqual({schemaType: imageType, assetType: 'image'})
    })

    it('returns file type for PDF when types include file', () => {
      const fileType = createMockSchemaType('file')
      const types: SchemaType[] = [fileType]
      const result = findMatchingSchemaType(createFileLike('application/pdf'), types)
      expect(result).toEqual({schemaType: fileType, assetType: 'file'})
    })

    it('returns video type for video file when types include video', () => {
      const videoType = createMockSchemaType('sanity.video')
      const types: SchemaType[] = [videoType]
      const result = findMatchingSchemaType(createFileLike('video/mp4'), types)
      expect(result).toEqual({schemaType: videoType, assetType: 'video'})
    })

    it('returns null for video/webm when video type has accept: video/mp4', () => {
      const videoType = createMockSchemaType('sanity.video', {accept: 'video/mp4'})
      const types: SchemaType[] = [videoType]
      const result = findMatchingSchemaType(createFileLike('video/webm'), types)
      expect(result).toBeNull()
    })

    it('returns null when no type matches', () => {
      const imageType = createMockSchemaType('image')
      const types: SchemaType[] = [imageType]
      const result = findMatchingSchemaType(createFileLike('video/mp4'), types)
      expect(result).toBeNull()
    })

    it('prefers image over file when both accept the file', () => {
      const imageType = createMockSchemaType('image')
      const fileType = createMockSchemaType('file')
      const types: SchemaType[] = [imageType, fileType]
      const result = findMatchingSchemaType(createFileLike('image/jpeg'), types)
      expect(result?.assetType).toBe('image')
    })
  })
})
