import {type FC, memo, useEffect} from 'react'

import {type VisualEditingConnection} from '../types'

export interface PostMessagePreviewsProps {
  comlink: VisualEditingConnection
}

const PostMessageFeatures: FC<PostMessagePreviewsProps> = (props) => {
  const {comlink} = props

  useEffect(() => {
    const unsubscribe = comlink.on('visual-editing/features', () => ({
      features: {
        optimistic: true,
      },
    }))
    return () => {
      unsubscribe()
    }
  }, [comlink])

  return null
}

export default memo(PostMessageFeatures)
