import {Observable} from 'rxjs'
import {useEffect, useState} from 'react'

// http://probablyprogramming.com/2009/03/15/the-tiniest-gif-ever
const PROBABLY_THE_TINIEST_GIF_EVER = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

function isBlob(src: string) {
  return src.startsWith('blob:')
}

export function loadImage(src: string): Observable<HTMLImageElement> {
  return new Observable((subscriber) => {
    const image = document.createElement('img')

    let completed = false
    const onload = () => {
      completed = true
      subscriber.next(image)
      subscriber.complete()
    }

    const onerror = () => {
      completed = true
      subscriber.error(new Error(`Could not load image from ${isBlob(src) ? 'blob' : src}`))
    }

    image.onload = onload
    image.onerror = onerror
    image.src = src

    return () => {
      image.onload = null
      image.onerror = null

      if (!completed) {
        // if we unsubscribe before it's loaded this will cancel the image loading
        image.src = PROBABLY_THE_TINIEST_GIF_EVER
      }
    }
  })
}

type ImageLoadState = {
  isLoading: boolean
  image?: HTMLImageElement
  error?: Error
}

const INITIAL_STATE = {isLoading: true}

export function useLoadImage(url: string): ImageLoadState {
  const [state, setState] = useState<ImageLoadState>(INITIAL_STATE)

  useEffect(() => {
    setState(INITIAL_STATE)
    const subscription = loadImage(url)
      // .pipe(delay(2000))
      .subscribe({
        error: (err) => {
          setState({isLoading: false, error: err})
        },
        next: (image) => {
          setState({image, isLoading: false})
        },
      })
    return () => {
      subscription.unsubscribe()
    }
  }, [url])

  return state
}
