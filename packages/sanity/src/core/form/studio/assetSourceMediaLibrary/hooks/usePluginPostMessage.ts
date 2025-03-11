import {useCallback, useEffect, useRef} from 'react'

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
  setIframe: (iframe: HTMLIFrameElement) => void
} => {
  const token = useToken()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const postFn = useCallback(
    (message: PluginPostMessage) => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow?.postMessage(message, origin)
      }
    },
    [origin],
  )

  useEffect(() => {
    const handler = (event: MessageEvent) => {
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
      if (iframeRef.current?.contentWindow) {
        window.removeEventListener('message', handler, false)
      }
    }
  }, [handleMessage, iframeRef, postFn, token])

  return {postMessage: postFn, setIframe: (iframe) => (iframeRef.current = iframe)}
}
