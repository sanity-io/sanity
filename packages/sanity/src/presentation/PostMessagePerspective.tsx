import {type ClientPerspective} from '@sanity/client'
import {type FC, memo, startTransition, useEffect} from 'react'

import {type VisualEditingConnection} from './types'

export interface PostMessagePerspectiveProps {
  comlink: VisualEditingConnection
  perspective: ClientPerspective
  variant: string | undefined
  setHandlesPerspectiveChange: (payload: boolean) => void
  setHandlesVariantChange: (payload: boolean) => void
}

const PostMessagePerspective: FC<PostMessagePerspectiveProps> = (props) => {
  const {comlink, perspective, variant, setHandlesPerspectiveChange, setHandlesVariantChange} =
    props

  // Return the perspective and variant when requested
  useEffect(() => {
    return comlink.on('visual-editing/fetch-perspective', (payload) => {
      // Report back whether the visual editing handler is set up to own perspective switching or not, if the payload is `undefined` then it means the visual editing instance isn't recent enough and we treat it as false
      startTransition(() => {
        setHandlesPerspectiveChange(payload?.handlesPerspectiveChange === true)
        // Same capability handshake for variant switching: absent means the visual editing
        // instance predates variants and a variant change should reload the iframe
        setHandlesVariantChange(payload?.handlesVariantChange === true)
      })
      return {perspective, variant}
    })
  }, [comlink, perspective, variant, setHandlesPerspectiveChange, setHandlesVariantChange])

  // Dispatch a perspective message when the perspective or variant changes
  useEffect(() => {
    comlink.post('presentation/perspective', {perspective, variant})
  }, [comlink, perspective, variant])

  return null
}

export default memo(PostMessagePerspective)
