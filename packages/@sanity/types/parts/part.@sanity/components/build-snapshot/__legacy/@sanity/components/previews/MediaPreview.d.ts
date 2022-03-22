import type React from 'react'
import {MediaDimensions} from '../types'
interface MediaPreviewProps {
  title?: string
  subtitle?: React.ReactNode | React.FC<Record<string, unknown>>
  description?: React.ReactNode | React.FC<Record<string, unknown>>
  media?:
    | React.ReactNode
    | React.FC<{
        dimensions: MediaDimensions
        layout: 'media'
      }>
  progress?: number
  mediaDimensions?: MediaDimensions
  children?: React.ReactNode
  isPlaceholder?: boolean
}
export default class MediaPreview extends React.PureComponent<MediaPreviewProps> {
  render(): JSX.Element
}
export {}
