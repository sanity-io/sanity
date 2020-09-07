import classNames from 'classnames'
import defaultStyles from 'part:@sanity/components/previews/default-style'
import React from 'react'
import Styleable from '../utilities/Styleable'
import {PreviewMediaDimensions} from './types'

interface DefaultPreviewProps {
  title?: React.ReactNode | React.FC<{layout: 'default'}>
  subtitle?: React.ReactNode | React.FC<{layout: 'default'}>
  mediaDimensions?: PreviewMediaDimensions
  status?: React.ReactNode | React.FC<{layout: 'default'}>
  media?: React.ReactNode | React.FC<{dimensions: PreviewMediaDimensions; layout: 'default'}>
  isPlaceholder?: boolean
  children?: React.ReactNode
  // eslint-disable-next-line react/forbid-prop-types
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

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {
  width: 80,
  height: 80,
  aspect: 1,
  fit: 'crop'
}

class DefaultPreview extends React.PureComponent<DefaultPreviewProps> {
  // eslint-disable-next-line complexity
  render() {
    const {
      title = 'Untitled',
      subtitle,
      media,
      children,
      status,
      isPlaceholder,
      progress,
      mediaDimensions = DEFAULT_MEDIA_DIMENSIONS,
      styles = {}
    } = this.props

    if (isPlaceholder) {
      return (
        <div className={styles.placeholder}>
          <div className={styles.inner}>
            {media !== false && <div className={styles.media} />}
            <div className={styles.heading}>
              <h2 className={styles.title}>Loading…</h2>
              <h3 className={styles.subtitle}>Loading…</h3>
            </div>
          </div>
        </div>
      )
    }

    const className = classNames(styles.root, subtitle !== undefined && styles.hasSubtitle)

    return (
      <div className={className}>
        <div className={styles.inner}>
          {media !== false && media !== undefined && (
            <div className={styles.media}>
              {typeof media === 'function' &&
                media({dimensions: mediaDimensions, layout: 'default'})}

              {typeof media === 'string' && <div className={styles.mediaString}>{media}</div>}

              {React.isValidElement(media) && media}
            </div>
          )}

          <div className={styles.heading}>
            <h2 className={styles.title}>
              {typeof title !== 'function' && title}
              {typeof title === 'function' && title({layout: 'default'})}
            </h2>

            {(subtitle || subtitle === 0) && (
              <h3 className={styles.subtitle}>
                {(typeof subtitle === 'function' && subtitle({layout: 'default'})) || subtitle}
              </h3>
            )}
          </div>

          {status && (
            <div className={styles.status}>
              {(typeof status === 'function' && status({layout: 'default'})) || status}
            </div>
          )}

          {children && <div className={styles.children}>{children}</div>}

          {typeof progress === 'number' && progress > -1 && (
            <div className={styles.progress}>
              <div className={styles.progressBar} style={{width: `${progress}%`}} />
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default Styleable(DefaultPreview, defaultStyles)
