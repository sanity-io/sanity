import styles from 'part:@sanity/components/previews/inline-style'
import React from 'react'
import {MediaDimensions} from '../types'

interface InlinePreviewProps {
  title?: React.ReactNode | React.FC<{layout: 'inline'}>
  media?: React.ReactNode | React.FC<{dimensions: MediaDimensions; layout: 'default'}>
  children?: React.ReactNode
  mediaDimensions?: MediaDimensions
}

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 32,
  height: 32,
  fit: 'crop',
  aspect: 1,
}

export default class InlinePreview extends React.PureComponent<InlinePreviewProps> {
  // eslint-disable-next-line complexity
  render() {
    const {title, media, mediaDimensions = DEFAULT_MEDIA_DIMENSIONS, children} = this.props

    if (!title && !media) {
      return <span />
    }

    return (
      <span className={styles.root}>
        {media && (
          <span className={styles.media}>
            {typeof media === 'function' && media({dimensions: mediaDimensions, layout: 'default'})}
            {typeof media !== 'function' && media}
            {React.isValidElement(media) && media}
          </span>
        )}
        <span className={styles.title}>
          {(typeof title === 'function' && title({layout: 'inline'})) || title}
        </span>
        {children && <span className={styles.children}>{children}</span>}
      </span>
    )
  }
}
