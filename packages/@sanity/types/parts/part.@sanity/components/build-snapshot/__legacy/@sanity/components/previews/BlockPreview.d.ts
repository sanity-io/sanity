import type React from 'react'
import {MediaDimensions} from '../types'
declare type BlockPreviewFieldProp = React.ReactNode | (() => void)
declare type BlockPreviewMediaComponent = React.FunctionComponent<{
  dimensions: MediaDimensions
  layout: 'default'
}>
declare type BlockPreviewStatusComponent = React.FunctionComponent<{
  layout: 'default'
}>
interface BlockPreviewProps {
  title?: BlockPreviewFieldProp
  subtitle?: BlockPreviewFieldProp
  description?: BlockPreviewFieldProp
  mediaDimensions?: MediaDimensions
  media?: React.ReactNode | BlockPreviewMediaComponent
  status?: React.ReactNode | BlockPreviewStatusComponent
  children?: React.ReactNode
  extendedPreview?: BlockPreviewFieldProp
}
export default class BlockPreview extends React.PureComponent<BlockPreviewProps> {
  render(): JSX.Element
}
export {}
