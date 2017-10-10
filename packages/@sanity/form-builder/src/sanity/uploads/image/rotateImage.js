// @flow
import Observable from '@sanity/observable'
import orient from './orient'

// The eslint import plugin doesn't work well with opaque types
// https://github.com/benmosher/eslint-plugin-import/issues/921
// https://github.com/gajus/eslint-plugin-flowtype/issues/260
// eslint-disable-next-line import/named
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
  return loadImage(window.URL.createObjectURL(file))
    .mergeMap(image => orient(image, orientation))
}
