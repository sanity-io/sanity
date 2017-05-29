import Observable from '@sanity/observable/minimal'

// http://probablyprogramming.com/2009/03/15/the-tiniest-gif-ever
const PROBABLY_THE_TINIEST_GIF_EVER = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
const noop = () => {}

function isLocalFile(src) {
  return src.startsWith('blob:')
}

export function loadImage(src) {
  return new Observable(observer => {
    const image = document.createElement('img')
    let loaded = false
    const onload = () => {
      loaded = true
      observer.next(image)
      observer.complete()
    }
    const onerror = () => {
      observer.error(new Error(`Could not load image from ${isLocalFile(src) ? 'local file' : src}`))
    }

    image.onload = onload
    image.onerror = onerror

    image.src = src
    return () => {
      image.onload = image.onerror = noop
      if (!loaded) {
        image.src = PROBABLY_THE_TINIEST_GIF_EVER
      }
    }
  })
}
