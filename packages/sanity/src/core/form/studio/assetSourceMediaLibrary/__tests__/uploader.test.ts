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

  describe('terminal statuses', () => {
    it('updateFile with complete status applies immediately and emits all-complete', () => {
      const uploader = new MediaLibraryUploader()
      const [file] = uploader.upload([createFile('a.png')])
      const events: {
        type?: string
        files?: {status: string; progress: number}[]
      }[] = []
      uploader.subscribe((e) => events.push(e))

      uploader.updateFile(file.id, {status: 'complete', progress: 1})

      const allComplete = events.filter((e) => e.type === 'all-complete')
      expect(allComplete).toHaveLength(1)
      expect(allComplete[0].files?.[0].status).toBe('complete')
      expect(allComplete[0].files?.[0].progress).toBe(1)
      // reset() clears files after all-complete
      expect(uploader.getFiles()).toHaveLength(0)
    })

    it('updateFile with alreadyExists status applies immediately', () => {
      const uploader = new MediaLibraryUploader()
      const [file] = uploader.upload([createFile('duplicate.png')])
      const events: {type?: string; files?: {status: string}[]}[] = []
      uploader.subscribe((e) => events.push(e))

      uploader.updateFile(file.id, {status: 'alreadyExists'})

      const allComplete = events.filter((e) => e.type === 'all-complete')
      expect(allComplete).toHaveLength(1)
      expect(allComplete[0].files?.[0].status).toBe('alreadyExists')
    })

    it('all-complete fires only once every file has a terminal status', () => {
      const uploader = new MediaLibraryUploader()
      const files = uploader.upload([createFile('a.png'), createFile('b.png'), createFile('c.png')])
      const events: {type?: string; files?: {status: string}[]}[] = []
      uploader.subscribe((e) => events.push(e))

      uploader.updateFile(files[0].id, {status: 'complete', progress: 1})
      uploader.updateFile(files[1].id, {status: 'alreadyExists'})
      expect(events.filter((e) => e.type === 'all-complete')).toHaveLength(0)

      uploader.updateFile(files[2].id, {status: 'complete', progress: 1})

      const allComplete = events.filter((e) => e.type === 'all-complete')
      expect(allComplete).toHaveLength(1)
      expect(allComplete[0].files).toHaveLength(3)
      expect(allComplete[0].files?.[0].status).toBe('complete')
      expect(allComplete[0].files?.[1].status).toBe('alreadyExists')
      expect(allComplete[0].files?.[2].status).toBe('complete')
    })
  })

  describe('reset', () => {
    it('reset clears files', () => {
      const uploader = new MediaLibraryUploader()
      uploader.upload([createFile('a.png'), createFile('b.png')])

      uploader.reset()

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
    it('simulates the picker-mode ordering contract: writer holds the terminal status until its work is done', () => {
      // Simulates the flow used by ImageInput and FileInput with the Media
      // Library asset source. The writer (federated view, or the iframe
      // UploadAssetDialog's own buffering) does its source-side work — link,
      // onSelect — and only then writes the terminal status, because the last
      // terminal status fires all-complete and the input tears the flow down.
      const uploader = new MediaLibraryUploader()
      const file = createFile('photo.jpg')
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

      // 1. Upload progresses; no terminal status written yet.
      uploader.updateFile(uploadFile.id, {status: 'uploading', progress: 0.5})
      expect(allCompleteEvents).toHaveLength(0)

      // 2. Writer finishes linking + onSelect, then writes the terminal status.
      uploader.updateFile(uploadFile.id, {status: 'complete', progress: 1})

      expect(allCompleteEvents).toHaveLength(1)
      expect(allCompleteEvents[0].files?.[0].status).toBe('complete')
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
