import type React from 'react'
import {MediaDimensions} from '../types'
interface CreateDocumentPreviewProps {
  title?: React.ReactNode | React.FunctionComponent<unknown>
  subtitle?:
    | React.ReactNode
    | React.FunctionComponent<{
        layout: 'default'
      }>
  description?: React.ReactNode | React.FunctionComponent<unknown>
  media?: React.ReactNode | React.FunctionComponent<unknown>
  icon?: React.ComponentType<unknown>
  isPlaceholder?: boolean
  params?: {
    intent: 'create'
    template?: string
  }
  templateParams?: Record<string, unknown>
  onClick?: () => void
  mediaDimensions?: MediaDimensions
}
declare class CreateDocumentPreview extends React.PureComponent<CreateDocumentPreviewProps> {
  render(): JSX.Element
}
export default CreateDocumentPreview
