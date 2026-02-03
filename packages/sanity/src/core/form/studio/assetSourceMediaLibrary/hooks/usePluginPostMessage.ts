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
