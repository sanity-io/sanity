import {useToast} from '@sanity/ui'
import {useCallback, useEffect, useRef} from 'react'
declare const __DEV__: boolean

const SANITY_ERROR_HANDLER = Symbol.for('SANITY_ERROR_HANDLER')

function ErrorHandler({onUIError}) {
  const {push} = useToast()

  const prevErrorRef = useRef(null)

  const handleGlobalError = useCallback(
    (msg, url, lineNo, columnNo, err) => {
      // Workaround for issue triggering two errors in a row in DEV (https://github.com/facebook/react/issues/10474)
      // We store a ref to the previous error and checks if it's equal to the current
      if (prevErrorRef.current === err) {
        prevErrorRef.current = null
        return
      }
      prevErrorRef.current = err

      // Certain events (ResizeObserver max loop threshold, for instance)
      // only gives a _message_. We choose to ignore these events since
      // they are usually not _fatal_
      if (!err) {
        return
      }

      // Certain errors should be ignored
      if (
        [
          /unexpected token <$/i, // Trying to load HTML as JS
        ].some((item) => item.test(err.message))
      ) {
        return
      }

      // NOTE: This checks if the error is the common "missing theme content value"
      // error thrown by `@sanity/ui`, in order to take steps to render a helpful error message.
      if (err.message.includes('useRootTheme():')) {
        onUIError(err)
        return
      }

      // eslint-disable-next-line no-console
      console.error(err)

      push({
        closable: true,
        status: 'error',
        title: __DEV__ ? `Error: ${err.message}` : 'An error occured',
        description: "Check your browser's JavaScript console for details.",
      })
    },
    [onUIError, push]
  )

  ;(handleGlobalError as any).identity = SANITY_ERROR_HANDLER

  useEffect(() => {
    let originalErrorHandler

    // Only store the original error handler if it wasn't a copy of _this_ error handler
    if (window.onerror && (window.onerror as any).identity !== SANITY_ERROR_HANDLER) {
      originalErrorHandler = window.onerror
    }

    window.onerror = handleGlobalError

    return () => {
      window.onerror = originalErrorHandler
    }
  }, [handleGlobalError])

  return null
}

export default ErrorHandler
