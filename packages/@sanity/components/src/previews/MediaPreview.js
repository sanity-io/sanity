/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/previews/media-style'
import ProgressCircle from 'part:@sanity/components/progress/circle'

const fieldProp = PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.func])

export default class MediaPreview extends React.PureComponent {
  static propTypes = {
    title: fieldProp,
    subtitle: fieldProp,
    description: fieldProp,
    media: fieldProp,
    progress: PropTypes.number,
    mediaDimensions: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      fit: PropTypes.oneOf(['clip', 'crop', 'fill', 'fillmax', 'max', 'scale', 'min']),
      aspect: PropTypes.number
    }),
    children: PropTypes.node,
    isPlaceholder: PropTypes.bool
  }

  static defaultProps = {
    title: undefined,
    subtitle: undefined,
    description: undefined,
    media: undefined,
    isPlaceholder: false,
    children: undefined,
    mediaDimensions: {width: 160, height: 160, aspect: 1, fit: 'crop'}
  }

  render() {
    const {
      title,
      subtitle,
      description,
      media,
      mediaDimensions,
      children,
      isPlaceholder,
      progress
    } = this.props

    if (isPlaceholder) {
      return (
        <div className={styles.root}>
          <div
            className={styles.padder}
            style={{paddingTop: `${100 / mediaDimensions.aspect || 100}%`}}
          />
        </div>
      )
    }

    return (
      <div className={styles.root} title={title}>
        <div
          className={styles.padder}
          style={{paddingTop: `${100 / mediaDimensions.aspect || 100}%`}}
        />

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
