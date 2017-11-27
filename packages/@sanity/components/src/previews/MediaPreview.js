import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/previews/media-style'
import SvgPlaceholder from './common/SvgPlaceholder'

export default class MediaPreview extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string,
    subtitle: PropTypes.string,
    description: PropTypes.string,
    renderMedia: PropTypes.func,
    mediaDimensions: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      fit: PropTypes.oneOf(['clip', 'crop', 'clamp']),
      aspect: PropTypes.number,
    }),
    children: PropTypes.node,
    isPlaceholder: PropTypes.bool
  }

  static defaultProps = {
    mediaDimensions: {width: 160, height: 160, aspect: 1, fit: 'crop'}
  }

  render() {
    const {
      title,
      subtitle,
      description,
      renderMedia,
      mediaDimensions,
      children,
      isPlaceholder
    } = this.props

    if (isPlaceholder) {
      return (
        <div className={styles.root}>
          <div className={styles.padder} style={{paddingTop: `${100 / mediaDimensions.aspect || 100}%`}} />
          <div className={styles.mediaContainer}>
            <SvgPlaceholder styles={styles} />
          </div>
        </div>
      )
    }

    return (
      <div className={styles.root} title={title}>
        <div className={styles.padder} style={{paddingTop: `${100 / mediaDimensions.aspect || 100}%`}} />
        <div className={styles.mediaContainer}>
          {renderMedia(mediaDimensions)}
        </div>
        <div className={styles.meta}>
          <div className={styles.metaInner}>
            {
              title && (
                <h2 className={styles.title}>
                  {title}
                </h2>
              )
            }
            {
              subtitle && (
                <h3 className={styles.subtitle}>
                  {subtitle}
                </h3>
              )
            }
            {
              description && (
                <p className={styles.description}>{description}</p>
              )
            }
          </div>
        </div>
        {children}
      </div>
    )
  }
}
