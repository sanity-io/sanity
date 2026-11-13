import {useCallback, useEffect, useState} from 'react'

import {type PluginPostMessage} from '../types'
import {useToken} from './useToken'

export const usePluginPostMessage = (
  origin: string,
  handleMessage?: (
    message: PluginPostMessage,
    postMessage: (msg: PluginPostMessage) => void,
  ) => void,
): {
  postMessage: (message: PluginPostMessage) => void
  setIframe: (iframe: HTMLIFrameElement | null) => void
} => {
  const token = useToken()
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null)

  const postFn = useCallback(
    (message: PluginPostMessage) => {
      if (iframe?.contentWindow) {
        iframe.contentWindow?.postMessage(message, origin)
      }
    },
    [origin, iframe],
  )

  // The Media Library asks for a token once and keeps it. A rotated access token (OAuth) revokes
  // the one it holds, so hand it the current token whenever it changes, without waiting to be
  // asked. A message sent before the page has loaded is dropped; the page then asks itself.
  useEffect(() => {
    if (token) postFn({type: 'tokenResponse', token})
  }, [postFn, token])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!iframe) {
        return
      }
      if (event.source !== iframe?.contentWindow) {
        return
      }
      if (event.data.type === 'tokenRequest') {
        postFn({
          type: 'tokenResponse',
          token: token || null,
        })
      }
      if (handleMessage) {
        handleMessage(event.data, postFn)
      }
    }
    window.addEventListener('message', handler, false)
    return () => {
      window.removeEventListener('message', handler, false)
    }
  }, [handleMessage, iframe, postFn, token])

  return {postMessage: postFn, setIframe}
}
