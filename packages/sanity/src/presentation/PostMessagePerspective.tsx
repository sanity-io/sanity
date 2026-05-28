import {type ClientPerspective} from '@sanity/client'
import {type FC, memo, startTransition, useEffect} from 'react'

import {type VisualEditingConnection} from './types'

export interface PostMessagePerspectiveProps {
  comlink: VisualEditingConnection
  perspective: ClientPerspective
  setHandlesPerspectiveChange: (payload: boolean) => void
}

const PostMessagePerspective: FC<PostMessagePerspectiveProps> = (props) => {
  const {comlink, perspective, setHandlesPerspectiveChange} = props

  // Return the perspective when requested
  useEffect(() => {
    return comlink.on('visual-editing/fetch-perspective', (payload) => {
      // Report back whether the visual editing handler is set up to own perspective switching or not, if the payload is `undefined` then it means the visual editing instance isn't recent enough and we treat it as false
      startTransition(() => setHandlesPerspectiveChange(payload?.handlesPerspectiveChange === true))
      return {perspective}
    })
  }, [comlink, perspective, setHandlesPerspectiveChange])

  // Dispatch a perspective message when the perspective changes
  useEffect(() => {
    comlink.post('presentation/perspective', {perspective})
  }, [comlink, perspective])

  return null
}

export default memo(PostMessagePerspective)
