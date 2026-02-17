import {describe, expect, it} from 'vitest'

import {MediaLibraryUploader} from '../uploader'

function createFile(name: string): File {
  return new File(['content'], name, {type: 'image/png'})
}

describe('MediaLibraryUploader', () => {
  describe('upload and updateFile', () => {
    it('creates files with pending status', () => {
      const uploader = new MediaLibraryUploader()
      const files = uploader.upload([createFile('a.png'), createFile('b.png')])

      expect(files).toHaveLength(2)
      expect(files.every((f) => f.status === 'pending')).toBe(true)
    })

    it('updateFile with error status applies immediately and emits all-complete when all done', () => {
      const uploader = new MediaLibraryUploader()
      const [file] = uploader.upload([createFile('a.png')])
      const events: {type?: string; files?: {status: string}[]}[] = []
      uploader.subscribe((e) => events.push(e))

      uploader.updateFile(file.id, {
        status: 'error',
        error: new Error('Upload failed'),
      })

      const allComplete = events.filter((e) => e.type === 'all-complete')
      expect(allComplete).toHaveLength(1)
      expect(allComplete[0].files?.[0].status).toBe('error')
      // reset() clears files after all-complete
      expect(uploader.getFiles()).toHaveLength(0)
    })

    it('updateFile with aborted status applies immediately', () => {
      const uploader = new MediaLibraryUploader()
      const [file] = uploader.upload([createFile('a.png')])
      const events: {type?: string; files?: {status: string}[]}[] = []
      uploader.subscribe((e) => events.push(e))
      uploader.updateFile(file.id, {status: 'uploading'})
      uploader.updateFile(file.id, {status: 'aborted'})

      const allComplete = events.filter((e) => e.type === 'all-complete')
      expect(allComplete).toHaveLength(1)
      expect(allComplete[0].files?.[0].status).toBe('aborted')
    })
  })

  describe('deferred terminal statuses', () => {
    it('updateFile with complete status is deferred and does NOT emit all-complete immediately', () => {
      const uploader = new MediaLibraryUploader()
      const [file] = uploader.upload([createFile('a.png')])
      const events: {type?: string}[] = []
      uploader.subscribe((e) => events.push(e as {type?: string}))

      uploader.updateFile(file.id, {status: 'complete', progress: 1})

      // Status should still be pending (deferred)
      expect(uploader.getFiles()[0].status).toBe('pending')
      const allComplete = events.filter((e) => e.type === 'all-complete')
      expect(allComplete).toHaveLength(0)
    })

    it('updateFile with alreadyExists status is deferred', () => {
      const uploader = new MediaLibraryUploader()
      const [file] = uploader.upload([createFile('a.png')])
      const events: {type?: string}[] = []
      uploader.subscribe((e) => events.push(e as {type?: string}))

      uploader.updateFile(file.id, {status: 'alreadyExists'})

      expect(uploader.getFiles()[0].status).toBe('pending')
      const allComplete = events.filter((e) => e.type === 'all-complete')
      expect(allComplete).toHaveLength(0)
    })

    it('signalCompletion applies deferred updates and emits all-complete', () => {
      const uploader = new MediaLibraryUploader()
      const [file] = uploader.upload([createFile('a.png')])
      const events: {
        type?: string
        files?: {status: string; progress: number}[]
      }[] = []
      uploader.subscribe((e) => events.push(e))

      uploader.updateFile(file.id, {status: 'complete', progress: 1})
      expect(uploader.getFiles()[0].status).toBe('pending')

      uploader.signalCompletion()

      const allComplete = events.filter((e) => e.type === 'all-complete')
      expect(allComplete).toHaveLength(1)
      expect(allComplete[0].files?.[0].status).toBe('complete')
      expect(allComplete[0].files?.[0].progress).toBe(1)
    })

    it('signalCompletion with alreadyExists applies status correctly', () => {
      const uploader = new MediaLibraryUploader()
      const [file] = uploader.upload([createFile('duplicate.png')])
      const events: {type?: string; files?: {status: string}[]}[] = []
      uploader.subscribe((e) => events.push(e))

      uploader.updateFile(file.id, {status: 'alreadyExists'})
      uploader.signalCompletion()

      const allComplete = events.filter((e) => e.type === 'all-complete')
      expect(allComplete[0].files?.[0].status).toBe('alreadyExists')
    })

    it('signalCompletion with multiple deferred files applies all', () => {
      const uploader = new MediaLibraryUploader()
      const files = uploader.upload([createFile('a.png'), createFile('b.png'), createFile('c.png')])
      const events: {type?: string; files?: {status: string}[]}[] = []
      uploader.subscribe((e) => events.push(e))

      uploader.updateFile(files[0].id, {status: 'complete', progress: 1})
      uploader.updateFile(files[1].id, {status: 'alreadyExists'})
      uploader.updateFile(files[2].id, {status: 'complete', progress: 1})

      expect(uploader.getFiles().every((f) => f.status === 'pending')).toBe(true)

      uploader.signalCompletion()

      const allComplete = events.filter((e) => e.type === 'all-complete')
      expect(allComplete).toHaveLength(1)
      expect(allComplete[0].files).toHaveLength(3)
      expect(allComplete[0].files?.[0].status).toBe('complete')
      expect(allComplete[0].files?.[1].status).toBe('alreadyExists')
      expect(allComplete[0].files?.[2].status).toBe('complete')
    })

    it('signalCompletion is no-op when no deferred updates', () => {
      const uploader = new MediaLibraryUploader()
      const [file] = uploader.upload([createFile('a.png')])
      const events: {type?: string}[] = []
      uploader.subscribe((e) => events.push(e as {type?: string}))

      // Use error which is not deferred
      uploader.updateFile(file.id, {status: 'error'})
      expect(uploader.getFiles()).toHaveLength(0) // reset clears on all-complete

      // signalCompletion on empty uploader should not throw
      expect(() => uploader.signalCompletion()).not.toThrow()
    })
  })

  describe('reset', () => {
    it('reset clears files and deferred updates', () => {
      const uploader = new MediaLibraryUploader()
      const [file] = uploader.upload([createFile('a.png')])
      uploader.updateFile(file.id, {status: 'complete'})

      uploader.reset()

      expect(uploader.getFiles()).toHaveLength(0)
      // signalCompletion after reset should not apply any deferred updates
      uploader.signalCompletion()
      expect(uploader.getFiles()).toHaveLength(0)
    })
  })

  describe('subscribe', () => {
    it('subscribers receive progress and status events', () => {
      const uploader = new MediaLibraryUploader()
      const [file] = uploader.upload([createFile('a.png')])
      const events: {type?: string}[] = []
      uploader.subscribe((e) => events.push(e as {type?: string}))

      uploader.updateFile(file.id, {status: 'uploading', progress: 0.5})

      const progressEvents = events.filter((e) => e.type === 'progress')
      const statusEvents = events.filter((e) => e.type === 'status')
      expect(progressEvents.length).toBeGreaterThan(0)
      expect(statusEvents.length).toBeGreaterThan(0)
    })

    it('unsubscribe stops receiving events', () => {
      const uploader = new MediaLibraryUploader()
      const [file] = uploader.upload([createFile('a.png')])
      const events: {type?: string}[] = []
      const unsub = uploader.subscribe((e) => events.push(e as {type?: string}))

      unsub()
      uploader.updateFile(file.id, {status: 'error'})

      expect(events.filter((e) => e.type === 'all-complete')).toHaveLength(0)
    })
  })

  describe('Media Library integration flow (ImageInput/FileInput)', () => {
    it('simulates uploadResponse flow: deferred progress then signalCompletion after select', () => {
      // Simulates the flow used by ImageInput and FileInput with Media Library asset source:
      // 1. User selects file → handleSelectFileToUpload creates MediaLibraryUploader
      // 2. Plugin sends uploadProgress(complete) → deferred (no all-complete yet)
      // 3. Plugin sends uploadResponse → handleUploaded (onSelect) → signalCompletion
      // 4. all-complete fires → input resets (setSelectedAssetSource(null), setIsUploading(false))
      const uploader = new MediaLibraryUploader()
      const file = createFile('photo.jpg')
      const files = uploader.upload([file])
      const [uploadFile] = files

      const allCompleteEvents: {
        type?: string
        files?: {status: string}[]
      }[] = []
      uploader.subscribe((e) => {
        if (e.type === 'all-complete') {
          allCompleteEvents.push(e)
        }
      })

      // 1. Plugin sends uploadProgress with complete (deferred in uploader)
      uploader.updateFile(uploadFile.id, {status: 'complete', progress: 1})
      expect(allCompleteEvents).toHaveLength(0)

      // 2. Plugin sends uploadResponse; UploadAssetDialog calls handleUploaded then signalCompletion
      uploader.signalCompletion()

      expect(allCompleteEvents).toHaveLength(1)
      expect(allCompleteEvents[0].files?.[0].status).toBe('complete')
    })

    it('simulates alreadyExists flow: deferred then signalCompletion', () => {
      // When file already exists in Media Library: uploadProgress(alreadyExists) → deferred
      // → uploadResponse → handleUploaded → signalCompletion → all-complete with alreadyExists
      const uploader = new MediaLibraryUploader()
      const file = createFile('duplicate.jpg')
      const [uploadFile] = uploader.upload([file])

      const allCompleteEvents: {
        type?: string
        files?: {status: string}[]
      }[] = []
      uploader.subscribe((e) => {
        if (e.type === 'all-complete') {
          allCompleteEvents.push(e)
        }
      })

      uploader.updateFile(uploadFile.id, {status: 'alreadyExists'})
      expect(allCompleteEvents).toHaveLength(0)

      uploader.signalCompletion()

      expect(allCompleteEvents).toHaveLength(1)
      expect(allCompleteEvents[0].files?.[0].status).toBe('alreadyExists')
    })
  })

  describe('abort', () => {
    it('abort marks pending/uploading files as aborted', () => {
      const uploader = new MediaLibraryUploader()
      const [file] = uploader.upload([createFile('a.png')])
      const events: {type?: string; files?: {status: string}[]}[] = []
      uploader.subscribe((e) => events.push(e))
      uploader.updateFile(file.id, {status: 'uploading'})

      uploader.abort()

      const allComplete = events.filter((e) => e.type === 'all-complete')
      expect(allComplete).toHaveLength(1)
      expect(allComplete[0].files?.[0].status).toBe('aborted')
    })
  })
})
