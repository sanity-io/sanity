import Observable from '@sanity/observable/minimal'

import orient from './orient'

const orientations = [
  'top-left',
  'top-right',
  'bottom-right',
  'bottom-left',
  'left-top',
  'right-top',
  'right-bottom',
  'left-bottom'
]

function readImage(url) {
  /* global window */
  return new Observable(observer => {
    const image = new window.Image()
    //console.time("read image");
    image.onerror = err => {
      observer.error(err)
    }
    image.onload = () => {
      //console.timeEnd("read image");
      observer.next(image)
    }
    return () => {
      // todo: cancel loading
    }
  })
}

export default function rotateImage(file, orientation) {
  /* global window */
  const objectUrl = window.URL.createObjectURL(file)
  return readImage(objectUrl)
    .mergeMap(image => orient(image, orientations.indexOf(orientation) + 1))
}
