/// <reference types="lodash" />
import elementResizeDetectorMaker from 'element-resize-detector'
import React from 'react'
import {MediaDimensions} from '../types'
interface CardPreviewProps {
  title?: React.ReactNode | React.FC<unknown>
  subtitle?:
    | React.ReactNode
    | React.FC<{
        layout: 'card'
      }>
  description?:
    | React.ReactNode
    | React.FC<{
        layout: 'card'
      }>
  date?: Date
  status?:
    | React.ReactNode
    | React.FC<{
        layout: 'default'
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
export default class CardPreview extends React.PureComponent<CardPreviewProps> {
  static defaultProps: {
    title: string
    subtitle: any
    description: any
    date: any
    status: any
    media: any
    isPlaceholder: boolean
    children: any
  }
  index: number
  _elementResizeDetector: elementResizeDetectorMaker.Erd
  state: {
    emWidth: number
  }
  dateElement: HTMLDivElement | null
  UNSAFE_componentWillReceiveProps(nextProps: any): void
  componentWillUnmount(): void
  setDateElement: (element: HTMLDivElement | null) => void
  onResize: import('lodash').DebouncedFunc<() => void>
  render(): JSX.Element
}
export {}
