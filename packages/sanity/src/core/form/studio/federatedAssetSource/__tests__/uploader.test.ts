import {type AssetSourceUploadEvent} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {PickerModeUploader} from '../uploader'

function fakeFile(name: string): globalThis.File {
  return new File(['content'], name, {type: 'text/plain'})
}

function record(uploader: PickerModeUploader): AssetSourceUploadEvent[] {
  const events: AssetSourceUploadEvent[] = []
  uploader.subscribe((event) => events.push(event))
  return events
}

describe('PickerModeUploader', () => {
  it('emits progress on the documented 0-100 scale, unchanged from the writer', () => {
    const uploader = new PickerModeUploader()
    const [file] = uploader.upload([fakeFile('a.txt')])
    const events = record(uploader)

    uploader.updateFile(file.id, {progress: 50})

    const progressEvents = events.filter((event) => event.type === 'progress')
    expect(progressEvents.at(-1)).toMatchObject({progress: 50})
    expect(uploader.getFiles()[0].progress).toBe(50)
  })

  it('replays the same scale to late subscribers as it emits live', () => {
    const uploader = new PickerModeUploader()
    const [file] = uploader.upload([fakeFile('a.txt')])

    const live = record(uploader)
    uploader.updateFile(file.id, {progress: 50, status: 'uploading'})
    const replayed = record(uploader)

    const liveProgress = live.filter((event) => event.type === 'progress').at(-1)
    const replayedProgress = replayed.filter((event) => event.type === 'progress').at(-1)
    expect(replayedProgress?.progress).toBe(liveProgress?.progress)
  })

  it('keeps the aborted file in the abort event when it was the last active one', () => {
    const uploader = new PickerModeUploader()
    const [first, second] = uploader.upload([fakeFile('a.txt'), fakeFile('b.txt')])
    const events = record(uploader)

    uploader.updateFile(first.id, {status: 'complete'})
    // Aborting the last active file triggers all-complete (which resets the
    // file list); the abort event must still name its target.
    uploader.abort(second)

    const abortEvent = events.find((event) => event.type === 'abort')
    expect(abortEvent?.files.map((file) => file.id)).toEqual([second.id])
    const allComplete = events.find((event) => event.type === 'all-complete')
    expect(allComplete).toBeDefined()
    expect(events.indexOf(abortEvent!)).toBeLessThan(events.indexOf(allComplete!))
  })

  it('aborts every active file and names them all when called without a target', () => {
    const uploader = new PickerModeUploader()
    const files = uploader.upload([fakeFile('a.txt'), fakeFile('b.txt')])
    const events = record(uploader)

    uploader.abort()

    const abortEvent = events.find((event) => event.type === 'abort')
    expect(abortEvent?.files.map((file) => file.id)).toEqual(files.map((file) => file.id))
    expect(events.some((event) => event.type === 'all-complete')).toBe(true)
  })
})
