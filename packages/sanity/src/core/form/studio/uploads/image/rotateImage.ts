import {Observable} from 'rxjs'
import {mergeMap} from 'rxjs/operators'
import {orient, Orientation} from './orient'

function loadImage(url: string): Observable<HTMLImageElement> {
  return new Observable((observer) => {
    const image = new window.Image()
    //console.time("read image");
    image.onerror = () => {
      observer.error(
        new Error(`Could not load image from url "${url}". Image may be of an unsupported format`)
      )
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

export function rotateImage(file: File, orientation: Orientation) {
  return loadImage(window.URL.createObjectURL(file)).pipe(
    mergeMap((image) => orient(image, orientation))
  )
}
