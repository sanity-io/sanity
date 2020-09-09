import styles from 'part:@sanity/components/previews/detail-style'
import React from 'react'
import {MediaDimensions} from '../types'

interface DetailPreviewProps {
  title?: React.ReactNode | React.FC<{layout: 'detail'}>
  subtitle?: React.ReactNode | React.FC<{layout: 'detail'}>
  description?: React.ReactNode | React.FC<{layout: 'detail'}>
  status?: React.ReactNode | React.FC<{layout: 'detail'}>
  media?: React.ReactNode | React.FC<{dimensions: MediaDimensions; layout: 'default'}>
  mediaDimensions?: MediaDimensions
  children?: React.ReactNode
  isPlaceholder?: boolean
}

let index = 0

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 120,
  height: 120,
  fit: 'crop',
  aspect: 1
}

export default class DetailPreview extends React.PureComponent<DetailPreviewProps> {
  index = index++

  // eslint-disable-next-line complexity
  render() {
    const {
      title,
      subtitle,
      description,
      mediaDimensions = DEFAULT_MEDIA_DIMENSIONS,
      media,
      status,
      children,
      isPlaceholder
    } = this.props

    if (isPlaceholder) {
      return (
        <div className={styles.placeholder}>
          {media !== false && <div className={styles.media} />}
          <div className={styles.content}>
            <h2 className={styles.title}>Loading</h2>
            <h3 className={styles.subtitle}>Loading</h3>
            <p className={styles.description}>Loading</p>
          </div>
        </div>
      )
    }

    return (
      <div className={styles.root}>
        {media !== false && (
          <div className={styles.media}>
            {typeof media === 'function' && media({dimensions: mediaDimensions, layout: 'default'})}
            {typeof media === 'string' && <div className={styles.mediaString}>{media}</div>}
            {React.isValidElement(media) && media}
          </div>
        )}
        <div className={styles.content}>
          <div className={styles.top}>
            <div className={styles.heading}>
              <h2 className={styles.title}>
                {(typeof title === 'function' && title({layout: 'detail'})) || title || (
                  <em>Untitled</em>
                )}
              </h2>
              {subtitle && (
                <h3 className={styles.subtitle}>
                  {(typeof subtitle === 'function' && subtitle({layout: 'detail'})) || subtitle}
                </h3>
              )}
            </div>
            {status && (
              <div className={styles.status}>
                {(typeof status === 'function' && status({layout: 'detail'})) || status}
              </div>
            )}
          </div>
          {description && (
            <p className={styles.description}>
              {typeof description === 'function' && description({layout: 'detail'})}
              {typeof description === 'string' && description}
              {typeof description === 'object' && description}
            </p>
          )}
        </div>
        {children}
      </div>
    )
  }
}
