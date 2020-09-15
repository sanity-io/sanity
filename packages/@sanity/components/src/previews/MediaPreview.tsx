import styles from 'part:@sanity/components/previews/media-style'
import ProgressCircle from 'part:@sanity/components/progress/circle'
import React from 'react'
import {MediaDimensions} from '../types'

interface MediaPreviewProps {
  title?: string
  subtitle?: React.ReactNode | React.FC<Record<string, unknown>>
  description?: React.ReactNode | React.FC<Record<string, unknown>>
  media?: React.ReactNode | React.FC<{dimensions: MediaDimensions; layout: 'media'}>
  progress?: number
  mediaDimensions?: MediaDimensions
  children?: React.ReactNode
  isPlaceholder?: boolean
}

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 160,
  height: 160,
  aspect: 1,
  fit: 'crop'
}

export default class MediaPreview extends React.PureComponent<MediaPreviewProps> {
  // eslint-disable-next-line complexity
  render() {
    const {
      title,
      subtitle,
      description,
      media,
      mediaDimensions = DEFAULT_MEDIA_DIMENSIONS,
      children,
      isPlaceholder,
      progress
    } = this.props

    const aspect = mediaDimensions?.aspect || DEFAULT_MEDIA_DIMENSIONS.aspect!

    if (isPlaceholder) {
      return (
        <div className={styles.root}>
          <div className={styles.padder} style={{paddingTop: `${100 / aspect}%`}} />
        </div>
      )
    }

    return (
      <div className={styles.root} title={title}>
        <div className={styles.padder} style={{paddingTop: `${100 / aspect}%`}} />

        <div className={styles.mediaContainer}>
          {typeof media === 'undefined' && <div className={styles.mediaString}>{title}</div>}
          {typeof media === 'function' && media({dimensions: mediaDimensions, layout: 'media'})}
          {typeof media === 'string' && <div className={styles.mediaString}>{media}</div>}
          {React.isValidElement(media) && media}
          {typeof progress === 'number' && progress > -1 && (
            <div className={styles.progress}>
              <ProgressCircle percent={progress} showPercent text="Uploaded" />
            </div>
          )}
        </div>

        <div className={styles.meta}>
          <div className={styles.metaInner}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <h3 className={styles.subtitle}>{subtitle}</h3>}
            {description && <p className={styles.description}>{description}</p>}
          </div>
        </div>
        {children}
      </div>
    )
  }
}
