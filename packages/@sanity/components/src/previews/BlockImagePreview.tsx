import React from 'react'
import styles from 'part:@sanity/components/previews/block-image-style'
import {PreviewMediaDimensions} from './types'

type BlockImagePreviewStatusComponent = React.FunctionComponent<{
  layout: 'default'
}>

interface BlockImagePreviewProps {
  title?: React.ReactNode | React.FC<{}>
  subtitle?: React.ReactNode | React.FC<{}>
  description?: React.ReactNode | React.FC<{}>
  mediaDimensions?: PreviewMediaDimensions
  media?:
    | React.ReactNode
    | React.FunctionComponent<{dimensions: PreviewMediaDimensions; layout: 'blockImage'}>
  children?: React.ReactNode
  status?: React.ReactNode | BlockImagePreviewStatusComponent
  // type?: {
  //   title: string
  //   name: string
  // }
}

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {width: 600, height: 600, fit: 'fillmax'}

export default class BlockImagePreview extends React.PureComponent<BlockImagePreviewProps> {
  // static defaultProps = {
  //   type: {
  //     title: undefined,
  //     name: undefined
  //   }
  // }

  // eslint-disable-next-line complexity
  render() {
    const {title, subtitle, description, mediaDimensions, media, children, status} = this.props

    return (
      <div className={styles.root}>
        {title && (
          <header className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
          </header>
        )}

        <div className={styles.preview}>
          {media && (
            <div className={styles.media}>
              {typeof media === 'function' &&
                media({
                  dimensions: mediaDimensions || DEFAULT_MEDIA_DIMENSIONS,
                  layout: 'blockImage'
                })}
              {typeof media === 'string' && <div className={styles.mediaString}>{media}</div>}
              {React.isValidElement(media) && media}
            </div>
          )}

          {subtitle || description || status || (
            <div className={styles.heading}>
              {subtitle && <h3 className={styles.subtitle}>{subtitle}</h3>}
              {description && <p className={styles.description}>{description}</p>}
              {status && (
                <div className={styles.status}>
                  {(typeof status === 'function' && status({layout: 'default'})) || status}
                </div>
              )}
            </div>
          )}
        </div>

        {children && <div className={styles.children}>{children}</div>}
      </div>
    )
  }
}
