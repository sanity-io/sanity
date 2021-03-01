import {Observable, Observer} from 'rxjs'

// http://probablyprogramming.com/2009/03/15/the-tiniest-gif-ever
const PROBABLY_THE_TINIEST_GIF_EVER = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

const noop = () => undefined

function isLocalFile(src: string) {
  return src.startsWith('blob:')
}

export function loadImage(src: string) {
  return new Observable((observer: Observer<HTMLImageElement>) => {
    const image = document.createElement('img')

    let loaded = false

    const onload = () => {
      loaded = true
      observer.next(image)
      observer.complete()
    }

    const onerror = () => {
      observer.error(
        new Error(`Could not load image from ${isLocalFile(src) ? 'local file' : src}`)
      )
    }

    image.onload = onload
    image.onerror = onerror
    image.src = src

    return () => {
      image.onload = noop
      image.onerror = noop

      if (!loaded) {
        image.src = PROBABLY_THE_TINIEST_GIF_EVER
      }
    }
  })
}
