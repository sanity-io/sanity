import {type SanityClient} from '@sanity/client'
import {type AssetSourceUploadEvent, type SchemaType} from '@sanity/types'
import {Observable} from 'rxjs'
import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest'

import {set} from '../../../patch'
import {UPLOAD_STATUS_KEY} from '../../uploads/constants'
import {resolveUploader} from '../../uploads/resolveUploader'
import {createDatasetUploader} from '../uploader'

vi.mock('../../uploads/resolveUploader')

const mockSchemaType = {name: 'file', type: 'file', options: {}} as unknown as SchemaType

describe('DatasetUploader', () => {
  beforeEach(() => {
    vi.mocked(resolveUploader).mockReturnValue({
      type: 'file',
      accepts: '*',
      priority: 1,
      upload: () =>
        new Observable((subscriber) => {
          const intervalId = globalThis.setInterval(() => {
            subscriber.next({
              type: 'uploadProgress',
              patches: [set(50, [UPLOAD_STATUS_KEY, 'progress'])],
            })
          }, 5)
          return () => globalThis.clearInterval(intervalId)
        }),
    } as NonNullable<ReturnType<typeof resolveUploader>>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('abort() unsubscribes underlying uploads so onChange stops receiving patches', async () => {
    const onChange = vi.fn()
    const UploaderClass = createDatasetUploader({client: {} as SanityClient})
    const uploader = new UploaderClass()

    uploader.upload([new File(['x'], 'doc.pdf', {type: 'application/pdf'})], {
      schemaType: mockSchemaType,
      onChange,
    })

    await new Promise((r) => setTimeout(r, 25))
    expect(onChange.mock.calls.length).toBeGreaterThan(0)

    uploader.abort()

    const callsAfterAbort = onChange.mock.calls.length
    await new Promise((r) => setTimeout(r, 35))
    expect(onChange.mock.calls.length).toBe(callsAfterAbort)
  })

  // Regression for #12870: when no uploader matches the file (e.g. an image
  // with no extension, leaving `file.type` empty), upload silently stalled —
  // no event, stuck spinner, no toast. Now emits `error` + `all-complete`.
  it('emits error + all-complete when no uploader matches the file (e.g. extensionless image)', async () => {
    vi.mocked(resolveUploader).mockReturnValue(null)

    const onChange = vi.fn()
    const events: AssetSourceUploadEvent[] = []
    const UploaderClass = createDatasetUploader({client: {} as SanityClient})
    const uploader = new UploaderClass()

    uploader.subscribe((event) => {
      events.push(event)
    })

    // Mimics an image file with the extension stripped: empty `type`.
    const extensionless = new File(['x'], 'photo', {type: ''})
    uploader.upload([extensionless], {schemaType: mockSchemaType, onChange})

    // Wait for the deferred event emission (queueMicrotask).
    await new Promise((r) => setTimeout(r, 0))

    // An `error` event is emitted so `useAssetSourceUploader` shows the toast.
    expect(events.some((e) => e.type === 'error')).toBe(true)

    // `all-complete` fires so the consumer unsets the `_upload` patch (no stuck spinner).
    expect(events.some((e) => e.type === 'all-complete')).toBe(true)

    // The file transitions to `error` status (observable via the `status` event).
    const statusEvents = events.filter((e) => e.type === 'status')
    expect(statusEvents.some((e) => e.status === 'error')).toBe(true)
  })
})
