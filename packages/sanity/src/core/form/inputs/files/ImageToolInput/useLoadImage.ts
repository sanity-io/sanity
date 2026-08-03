import {useMemo} from 'react'
import {useSyncObservable} from 'react-rx'
import {catchError, map, Observable, of, startWith} from 'rxjs'

// http://probablyprogramming.com/2009/03/15/the-tiniest-gif-ever
const PROBABLY_THE_TINIEST_GIF_EVER = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

function isBlob(src: string) {
  return src.startsWith('blob:')
}

function loadImage(src: string): Observable<HTMLImageElement> {
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

const INITIAL_STATE: ImageLoadState = {isLoading: true}

export function useLoadImage(url: string): ImageLoadState {
  const state$ = useMemo(
    () =>
      loadImage(url).pipe(
        map((image): ImageLoadState => ({image, isLoading: false})),
        catchError((error: Error) => of({isLoading: false, error})),
        startWith(INITIAL_STATE),
      ),
    [url],
  )

  // Kept synchronous: `state$` resets to loading when `url` changes, and a
  // deferred snapshot could briefly render the previous image element under
  // the new url.
  return useSyncObservable(state$, INITIAL_STATE)
}
