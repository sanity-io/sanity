/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/previews/detail-style'

let index = 0
const fieldProp = PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.func])

export default class DetailPreview extends React.PureComponent {
  static propTypes = {
    title: fieldProp,
    subtitle: fieldProp,
    description: fieldProp,
    status: fieldProp,
    media: fieldProp,
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
    subtitle: undefined, // 'No subtitle…',
    description: undefined, // 'No description…',
    media: undefined,
    status: undefined,
    children: undefined,
    isPlaceholder: false,
    mediaDimensions: {width: 120, height: 120, fit: 'crop', aspect: 1}
  }

  index = index++

  render() {
    const {
      title,
      subtitle,
      description,
      mediaDimensions,
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
