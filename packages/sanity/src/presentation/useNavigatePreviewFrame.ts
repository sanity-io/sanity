import {type RefObject, useEffect} from 'react'

import {type ConnectionStatus, type FrameState, type VisualEditingConnection} from './types'

/**
 * Posts a `presentation/navigate` message to the preview frame whenever the
 * `preview` search param diverges from the URL the frame last reported
 * (`frameStateRef.current.url`), e.g. after a URL is typed into the preview
 * toolbar location bar.
 *
 * The frame is only marked as navigated when the message is actually posted:
 * while the overlays connection is down the divergence is left in place, so
 * the effect re-runs once the connection (re)establishes and delivers the
 * navigation then, instead of silently swallowing it.
 * @internal
 */
export function useNavigatePreviewFrame(options: {
  frameStateRef: RefObject<FrameState>
  overlaysConnection: ConnectionStatus
  preview: string | undefined
  targetOrigin: string
  visualEditingComlink: VisualEditingConnection | null
}): void {
  const {frameStateRef, overlaysConnection, preview, targetOrigin, visualEditingComlink} = options

  useEffect(() => {
    if (!frameStateRef.current.url || !preview || frameStateRef.current.url === preview) {
      return
    }
    try {
      const frameOrigin = new URL(frameStateRef.current.url, targetOrigin).origin
      const previewOrigin = new URL(preview, targetOrigin).origin
      if (frameOrigin !== previewOrigin) {
        return
      }
    } catch {
      // ignore
    }

    if (overlaysConnection !== 'connected') {
      return
    }

    frameStateRef.current.url = preview
    /**
     * Translate the possibly absolute params url back to a relative URL
     */
    let url = preview
    if (url.startsWith('http')) {
      try {
        const newUrl = new URL(preview, targetOrigin)
        url = newUrl.pathname + newUrl.search + newUrl.hash
      } catch {
        // ignore
      }
    }
    visualEditingComlink?.post('presentation/navigate', {
      url,
      type: 'replace',
    })
  }, [frameStateRef, overlaysConnection, preview, targetOrigin, visualEditingComlink])
}
