import type React from 'react'
import {MediaDimensions} from '../types'
declare type BlockImagePreviewStatusComponent = React.FunctionComponent<{
  layout: 'default'
}>
interface BlockImagePreviewProps {
  title?: React.ReactNode | React.FC<Record<string, unknown>>
  subtitle?: React.ReactNode | React.FC<Record<string, unknown>>
  description?: React.ReactNode | React.FC<Record<string, unknown>>
  mediaDimensions?: MediaDimensions
  media?:
    | React.ReactNode
    | React.FunctionComponent<{
        dimensions: MediaDimensions
        layout: 'blockImage'
      }>
  children?: React.ReactNode
  status?: React.ReactNode | BlockImagePreviewStatusComponent
}
export default class BlockImagePreview extends React.PureComponent<BlockImagePreviewProps> {
  render(): JSX.Element
}
export {}
