import {describe, expect, it} from 'vitest'

import {accepts} from '../accepts'

describe('accepts', () => {
  describe('returns true (accepts)', () => {
    it('when file or acceptedFiles is falsy', () => {
      expect(accepts(null as unknown as {type: string}, 'image/*')).toBe(true)
      expect(accepts({type: 'image/png'}, '')).toBe(true)
    })

    it('when acceptedFiles is an empty array (no restrictions)', () => {
      expect(accepts({type: 'image/png'}, [])).toBe(false)
    })

    it('for exact MIME type matches', () => {
      expect(accepts({type: 'image/png'}, 'image/png')).toBe(true)
      expect(accepts({type: 'image/jpeg'}, 'image/jpeg')).toBe(true)
      expect(accepts({type: 'application/pdf'}, 'application/pdf')).toBe(true)
    })

    it('for wildcard MIME type matches', () => {
      expect(accepts({type: 'image/png'}, 'image/*')).toBe(true)
      expect(accepts({type: 'image/jpeg'}, 'image/*')).toBe(true)
      expect(accepts({type: 'video/mp4'}, 'video/*')).toBe(true)
      expect(accepts({type: 'text/plain'}, 'text/*')).toBe(true)
    })

    it('for file extension matches with filename', () => {
      expect(accepts({type: 'application/pdf', name: 'document.pdf'}, '.pdf')).toBe(true)
      expect(accepts({type: 'image/jpeg', name: 'photo.jpg'}, '.jpg')).toBe(true)
      expect(accepts({type: 'image/jpeg', name: 'Photo.JPG'}, '.jpg')).toBe(true)
    })

    it('for file extension without filename (fail open)', () => {
      expect(accepts({type: 'application/pdf'}, '.pdf')).toBe(true)
      expect(accepts({type: 'application/pdf', name: ''}, '.pdf')).toBe(true)
    })

    it('when any of multiple accept values match', () => {
      expect(accepts({type: 'image/png'}, 'image/png,image/jpeg')).toBe(true)
      expect(accepts({type: 'image/jpeg'}, 'image/png,image/jpeg')).toBe(true)
      expect(accepts({type: 'image/png'}, ['image/png', 'image/jpeg'])).toBe(true)
      expect(accepts({type: 'image/jpeg'}, ['image/png', 'image/jpeg'])).toBe(true)
    })

    it('with spaces in the accept string', () => {
      expect(accepts({type: 'image/png'}, 'image/png, image/jpeg')).toBe(true)
      expect(accepts({type: 'image/jpeg'}, '  image/jpeg  ')).toBe(true)
    })

    it('case-insensitively for MIME types', () => {
      expect(accepts({type: 'IMAGE/PNG'}, 'image/png')).toBe(true)
      expect(accepts({type: 'image/png'}, 'IMAGE/PNG')).toBe(true)
    })

    it('case-insensitively for file extensions', () => {
      expect(accepts({type: '', name: 'document.PDF'}, '.pdf')).toBe(true)
      expect(accepts({type: '', name: 'document.pdf'}, '.PDF')).toBe(true)
    })
  })

  describe('returns false (rejects)', () => {
    it('when MIME type does not match', () => {
      expect(accepts({type: 'image/png'}, 'image/jpeg')).toBe(false)
      expect(accepts({type: 'video/mp4'}, 'image/*')).toBe(false)
    })

    it('when file extension does not match (with filename)', () => {
      expect(accepts({type: 'application/pdf', name: 'document.pdf'}, '.txt')).toBe(false)
      expect(accepts({type: 'image/jpeg', name: 'photo.jpg'}, '.png')).toBe(false)
    })

    it('when none of multiple accept values match', () => {
      expect(accepts({type: 'video/mp4'}, 'image/png,image/jpeg')).toBe(false)
      expect(accepts({type: 'video/mp4'}, ['image/png', 'image/jpeg'])).toBe(false)
    })

    it('when wildcard does not match the base MIME type', () => {
      expect(accepts({type: 'video/mp4'}, 'image/*')).toBe(false)
      expect(accepts({type: 'text/plain'}, 'image/*')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles empty file type', () => {
      expect(accepts({type: ''}, 'image/*')).toBe(false)
      expect(accepts({type: ''}, '.pdf')).toBe(true)
    })

    it('handles file with only name, no type', () => {
      expect(accepts({type: '', name: 'document.pdf'}, '.pdf')).toBe(true)
      expect(accepts({type: '', name: 'document.txt'}, '.pdf')).toBe(false)
    })

    it('handles mixed MIME types and extensions in accept', () => {
      expect(accepts({type: 'image/png'}, 'image/png,.pdf')).toBe(true)
      expect(accepts({type: '', name: 'document.pdf'}, 'image/png,.pdf')).toBe(true)
      expect(accepts({type: 'video/mp4', name: 'video.mp4'}, 'image/png,.pdf')).toBe(false)
    })

    it('handles complex accept strings', () => {
      const acceptString = 'image/*, video/mp4, .pdf, application/msword'
      expect(accepts({type: 'image/png'}, acceptString)).toBe(true)
      expect(accepts({type: 'video/mp4'}, acceptString)).toBe(true)
      expect(accepts({type: '', name: 'doc.pdf'}, acceptString)).toBe(true)
      expect(accepts({type: 'application/msword'}, acceptString)).toBe(true)
      expect(accepts({type: 'audio/mp3', name: 'music.mp3'}, acceptString)).toBe(false)
    })

    it('fails open for extension-based accept when file has no name (hover behavior)', () => {
      expect(accepts({type: 'video/mp4'}, '.pdf')).toBe(true)
      expect(accepts({type: 'video/mp4'}, 'image/png,.pdf')).toBe(true)
      expect(accepts({type: 'audio/mp3'}, 'image/*, video/mp4, .pdf')).toBe(true)
    })
  })
})
