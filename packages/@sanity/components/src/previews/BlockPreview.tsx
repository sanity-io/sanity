/* eslint-disable complexity */

import React, {createElement} from 'react'
import styles from 'part:@sanity/components/previews/block-style'
import {PreviewMediaDimensions} from './types'

type BlockPreviewFieldProp = React.ReactNode | (() => void)

type BlockPreviewMediaComponent = React.FunctionComponent<{
  dimensions: PreviewMediaDimensions
  layout: 'default'
}>

type BlockPreviewStatusComponent = React.FunctionComponent<{
  layout: 'default'
}>

type MediaCallable = (options: {
  dimensions: PreviewMediaDimensions
  layout: 'default'
}) => React.ReactNode | null | undefined

interface BlockPreviewProps {
  title?: BlockPreviewFieldProp
  subtitle?: BlockPreviewFieldProp
  description?: BlockPreviewFieldProp
  mediaDimensions?: PreviewMediaDimensions
  media?: React.ReactNode | MediaCallable
  status?: React.ReactNode | BlockPreviewStatusComponent
  children?: React.ReactNode
  extendedPreview?: BlockPreviewFieldProp
  // type?: {
  //   title?: string
  //   name?: string
  // }
}

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {
  width: 160,
  height: 160,
  aspect: 1,
  fit: 'crop'
}

export default class BlockPreview extends React.PureComponent<BlockPreviewProps> {
  render() {
    const {
      title,
      subtitle,
      description,
      mediaDimensions,
      media,
      status,
      children,
      extendedPreview
      // type = {}
    } = this.props

    return (
      <div className={styles.root}>
        <div className={styles.header}>
          {media && (
            <div className={`${styles.media}`}>
              {typeof media === 'function' &&
                media({
                  dimensions: mediaDimensions || DEFAULT_MEDIA_DIMENSIONS,
                  layout: 'default'
                })}
              {typeof media === 'string' && <div className={styles.mediaString}>{media}</div>}
              {React.isValidElement(media) && media}
            </div>
          )}

          <div className={styles.heading}>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <h3 className={styles.subtitle}>{subtitle}</h3>}
            {description && <p className={styles.description}>{description}</p>}
          </div>

          {status && (
            <div className={styles.status}>
              {(typeof status === 'function' &&
                createElement(status as BlockPreviewStatusComponent, {layout: 'default'})) ||
                status}
            </div>
          )}
        </div>

        {children && <div className={styles.content}>{children}</div>}

        {extendedPreview && <div className={styles.extendedPreview}>{extendedPreview}</div>}
      </div>
    )
  }
}
