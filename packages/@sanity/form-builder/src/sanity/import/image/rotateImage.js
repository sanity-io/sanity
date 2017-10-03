// @flow
import Observable from '@sanity/observable'
import orient, {DEFAULT_ORIENTATION} from './orient'
import type {OrientationId} from './orient'

function loadImage(url: string) {
  /* global window */
  return new Observable(observer => {
    const image = new window.Image()
    //console.time("read image");
    image.onerror = () => {
      observer.error(new Error(`Could not load image from url "${url}". Image may be of an unsupported format`))
    }
    image.onload = () => {
      //console.timeEnd("read image");
      observer.next(image)
      observer.complete()
    }
    image.src = url
    return () => {
      // todo: cancel loading (if possible?)
    }
  })
}

export default function rotateImage(file: File, orientation: OrientationId) {
  /* global window */
  const objectUrl = window.URL.createObjectURL(file)
  if (orientation && orientation !== DEFAULT_ORIENTATION) {
    return Observable.of(objectUrl)
  }

  return loadImage(objectUrl)
    .mergeMap(image => orient(image, orientation))
    .map(blob => window.URL.createObjectURL(blob))
}
