import {useToast} from '@sanity/ui'
import {useCallback, useEffect} from 'react'

const SANITY_ERROR_HANDLER = Symbol.for('SANITY_ERROR_HANDLER')

function ErrorHandler() {
  const {push} = useToast()

  const handleGlobalError = useCallback(
    (msg, url, lineNo, columnNo, err) => {
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

      // eslint-disable-next-line no-console
      console.error(err)

      push({
        closable: true,
        status: 'error',
        title: __DEV__ ? `Error: ${err.message}` : 'An error occured',
        description: "Check your browser's JavaScript console for details.",
        timeout: 8000,
      })
    },
    [push]
  )

  handleGlobalError.identity = SANITY_ERROR_HANDLER

  useEffect(() => {
    let originalErrorHandler

    // Only store the original error handler if it wasn't a copy of _this_ error handler
    if (window.onerror && window.onerror.identity !== SANITY_ERROR_HANDLER) {
      originalErrorHandler = window.onerror
    }

    window.onerror = handleGlobalError

    return () => {
      window.onerror = originalErrorHandler || window.onerror
    }
  }, [handleGlobalError])

  return null
}

export default ErrorHandler
