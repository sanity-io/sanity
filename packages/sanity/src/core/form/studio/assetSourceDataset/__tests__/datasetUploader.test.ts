import {type SanityClient} from '@sanity/client'
import {type SchemaType} from '@sanity/types'
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
})
