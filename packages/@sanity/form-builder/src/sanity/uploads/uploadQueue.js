// @flow
import Multicast from '@sanity/observable/multicast'
import Observable from '@sanity/observable'

import {uploadImageAsset} from '../inputs/client-adapters/assets'

const uploadRequests$ = new Multicast

const CONCURRENCY = 4

const registry = []
export function createUploadId(file: File): number {
  const id = registry.length
  const events = new Multicast
  registry[id] = {
    file,
    events$: events.asObservable().do({
      complete: () => {
        registry[id] = null
      }}),
    _multicast: events
  }
  return id
}

export function getUploadEvents(uploadId: number) {
  const entry = registry[uploadId]
  if (!entry) {
    throw new Error(`Ooops, invalid upload id #${uploadId} this should not happen`)
  }
  return entry.events$
}

export function scheduleUpload(uploadId: number, file: File) {
  uploadRequests$.next({uploadId, file})
}

uploadRequests$.asObservable()
  .mergeMap(
    ({uploadId, file}) => new Observable(observer => {
      const upload = Observable.from(uploadImageAsset(file)).share()
      const registrySubscription = upload.subscribe(registry[uploadId]._multicast)
      const uploadSubscription = upload.subscribe(observer)
      return () => {
        registrySubscription.unsubscribe()
        uploadSubscription.unsubscribe()
      }
    }),
    CONCURRENCY
  )
  .subscribe()
