// @flow
import {Observable} from 'rxjs'

function createProgressEvent(progress) {
  return {type: 'progress', stage: 'upload', percent: progress}
}

function simulateProgress(updateInterval: number = 200, speed: number = 2) {
  return new Observable(observer => {
    let progress = 0
    observer.next(progress)
    const interval = setInterval(next, updateInterval)

    return () => clearInterval(interval)

    function next() {
      progress = Math.min(100, progress + (speed + Math.random() * speed))
      observer.next(progress)
      if (progress === 100) {
        observer.complete()
      }
    }
  })
}

export function mockUpload(assetDoc: Object) {
  return simulateProgress(100 + Math.random() * 500, 10 + Math.random() * 50)
    .map(createProgressEvent)
    .mergeMap(event => {
      return Observable.of(
        ...[
          event,
          event.percent === 100 && {
            type: 'complete',
            asset: assetDoc
          }
        ].filter(Boolean)
      )
    })
}
