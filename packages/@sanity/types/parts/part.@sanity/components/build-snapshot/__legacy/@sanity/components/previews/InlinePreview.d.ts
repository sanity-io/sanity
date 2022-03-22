import type React from 'react'
import {MediaDimensions} from '../types'
interface InlinePreviewProps {
  title?:
    | React.ReactNode
    | React.FC<{
        layout: 'inline'
      }>
  media?:
    | React.ReactNode
    | React.FC<{
        dimensions: MediaDimensions
        layout: 'default'
      }>
  children?: React.ReactNode
  mediaDimensions?: MediaDimensions
}
export default class InlinePreview extends React.PureComponent<InlinePreviewProps> {
  render(): JSX.Element
}
export {}
