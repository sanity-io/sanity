/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/previews/block-style'

const fieldProp = PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.func])

export default class BlockPreview extends React.PureComponent {
  static propTypes = {
    title: fieldProp,
    subtitle: fieldProp,
    description: fieldProp,
    mediaDimensions: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      fit: PropTypes.oneOf(['clip', 'crop', 'fill', 'fillmax', 'max', 'scale', 'min']),
      aspect: PropTypes.number
    }),
    media: fieldProp,
    status: fieldProp,
    children: PropTypes.func,
    extendedPreview: fieldProp,
    type: PropTypes.shape({
      title: PropTypes.string,
      name: PropTypes.string
    })
  }

  static defaultProps = {
    mediaDimensions: {width: 160, height: 160, aspect: 1, fit: 'crop'},
    type: {
      title: undefined,
      name: undefined
    }
  }

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
    } = this.props

    return (
      <div className={styles.root}>
        <div className={styles.header}>
          {media && (
            <div className={`${styles.media}`}>
              {typeof media === 'function' &&
                media({dimensions: mediaDimensions, layout: 'default'})}
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
              {(typeof status === 'function' && status({layout: 'default'})) || status}
            </div>
          )}
        </div>
        {children && <div className={styles.children}>{children}</div>}
        {extendedPreview && <div className={styles.extendedPreview}>{extendedPreview}</div>}
      </div>
    )
  }
}
