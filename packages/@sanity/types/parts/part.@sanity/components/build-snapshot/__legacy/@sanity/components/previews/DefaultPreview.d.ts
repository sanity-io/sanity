import type React from 'react'
import {MediaDimensions} from '../types'
interface DefaultPreviewProps {
  title?:
    | React.ReactNode
    | React.FC<{
        layout: 'default'
      }>
  subtitle?:
    | React.ReactNode
    | React.FC<{
        layout: 'default'
      }>
  mediaDimensions?: MediaDimensions
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
  isPlaceholder?: boolean
  children?: React.ReactNode
  styles?: {
    root?: string
    placeholder?: string
    inner?: string
    media?: string
    heading?: string
    title?: string
    subtitle?: string
    hasSubtitle?: string
    mediaString?: string
    status?: string
    children?: string
    progress?: string
    progressBar?: string
  }
  progress?: number
}
declare const _default: React.ComponentType<DefaultPreviewProps>
export default _default
