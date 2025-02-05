import {type FC, memo, useEffect} from 'react'

import {type VisualEditingConnection} from '../types'

export interface PostMessagePreviewsProps {
  comlink: VisualEditingConnection
}

const PostMessageFeatures: FC<PostMessagePreviewsProps> = (props) => {
  const {comlink} = props

  useEffect(() => {
    return comlink.on('visual-editing/features', () => ({
      features: {
        optimistic: true,
      },
    }))
  }, [comlink])

  return null
}

export default memo(PostMessageFeatures)
