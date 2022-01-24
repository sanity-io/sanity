import React from 'react'
import {IntentButton} from '../IntentButton'
import {PreviewMediaDimensions, TemplatePreview} from '../previews'

/**
 * @deprecated
 */
interface CreateDocumentPreviewProps {
  title?: React.ReactNode | React.FunctionComponent<unknown>
  subtitle?: React.ReactNode | React.FunctionComponent<{layout: 'default'}>
  description?: React.ReactNode | React.FunctionComponent<unknown>
  media?: React.ReactNode | React.FunctionComponent<unknown>
  icon?: React.ComponentType<unknown>
  isPlaceholder?: boolean
  params?: {
    intent: 'create'
    type: string
    template?: string
  }
  templateParams?: Record<string, unknown>
  onClick?: () => void
  mediaDimensions?: PreviewMediaDimensions
}

const DEFAULT_MEDIA_DIMENSION: PreviewMediaDimensions = {
  width: 80,
  height: 80,
  aspect: 1,
  fit: 'crop',
}

const BLOCK_STYLE = {
  display: 'flex',
  height: '100%',
  width: '100%',
  alignItems: 'flex-start',
}

/**
 * @deprecated
 */
export function CreateDocumentPreview(props: CreateDocumentPreviewProps) {
  const {
    title = 'Untitled',
    subtitle,
    media = props.icon,
    isPlaceholder,
    mediaDimensions = DEFAULT_MEDIA_DIMENSION,
    description,
    params,
    templateParams,
  } = props

  return (
    <IntentButton
      intent="create"
      params={[params, templateParams]}
      title={subtitle ? `Create new ${title} (${subtitle})` : `Create new ${title}`}
      onClick={props.onClick}
      style={BLOCK_STYLE}
      mode="ghost"
      fontSize={2}
    >
      <TemplatePreview
        description={description}
        isPlaceholder={isPlaceholder}
        media={media}
        mediaDimensions={mediaDimensions}
      />
    </IntentButton>
  )
}
