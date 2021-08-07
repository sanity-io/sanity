import React from 'react'
import {MediaDimensions} from '../types'
interface DetailPreviewProps {
  title?:
    | React.ReactNode
    | React.FC<{
        layout: 'detail'
      }>
  subtitle?:
    | React.ReactNode
    | React.FC<{
        layout: 'detail'
      }>
  description?:
    | React.ReactNode
    | React.FC<{
        layout: 'detail'
      }>
  status?:
    | React.ReactNode
    | React.FC<{
        layout: 'detail'
      }>
  media?:
    | React.ReactNode
    | React.FC<{
        dimensions: MediaDimensions
        layout: 'default'
      }>
  mediaDimensions?: MediaDimensions
  children?: React.ReactNode
  isPlaceholder?: boolean
}
export default class DetailPreview extends React.PureComponent<DetailPreviewProps> {
  index: number
  render(): JSX.Element
}
export {}
