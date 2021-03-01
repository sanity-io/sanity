import {IntentLink} from 'part:@sanity/base/router'
import React from 'react'
import {MediaDimensions} from '../types'

import styles from './CreateDocumentPreview.css'

interface CreateDocumentPreviewProps {
  title?: React.ReactNode | React.FunctionComponent<unknown>
  subtitle?: React.ReactNode | React.FunctionComponent<{layout: 'default'}>
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

const DEFAULT_MEDIA_DIMENSION: MediaDimensions = {
  width: 80,
  height: 80,
  aspect: 1,
  fit: 'crop',
}

class CreateDocumentPreview extends React.PureComponent<CreateDocumentPreviewProps> {
  // eslint-disable-next-line complexity
  render() {
    const {
      title = 'Untitled',
      subtitle,
      media = this.props.icon,
      isPlaceholder,
      mediaDimensions = DEFAULT_MEDIA_DIMENSION,
      description,
      params,
      templateParams,
    } = this.props

    if (isPlaceholder || !params) {
      return (
        <div className={styles.placeholder}>
          <div className={styles.heading}>
            <h2 className={styles.title}>Loading…</h2>
            <h3 className={styles.subtitle}>Loading…</h3>
          </div>
          {media !== false && <div className={styles.media} />}
        </div>
      )
    }

    return (
      <IntentLink
        intent="create"
        params={[params, templateParams]}
        className={styles.root}
        title={subtitle ? `Create new ${title} (${subtitle})` : `Create new ${title}`}
        onClick={this.props.onClick}
      >
        {media !== false && (
          <div className={styles.media}>
            {typeof media === 'function' && media({dimensions: mediaDimensions, layout: 'default'})}
            {typeof media === 'string' && <div className={styles.mediaString}>{media}</div>}
            {React.isValidElement(media) && media}
          </div>
        )}
        <div className={styles.heading}>
          <h2 className={styles.title}>
            {typeof title !== 'function' && title}
            {typeof title === 'function' && title({layout: 'default'})}
          </h2>
          {subtitle && (
            <h3 className={styles.subtitle}>
              {(typeof subtitle === 'function' && subtitle({layout: 'default'})) || subtitle}
            </h3>
          )}
        </div>
        {description && <p className={styles.description}>{description}</p>}
      </IntentLink>
    )
  }
}

export default CreateDocumentPreview
