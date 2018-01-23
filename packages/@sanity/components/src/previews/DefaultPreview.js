/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import defaultStyles from 'part:@sanity/components/previews/default-style'
import Styleable from '../utilities/Styleable'

const fieldProp = PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.func])

class DefaultPreview extends React.PureComponent {
  static propTypes = {
    title: fieldProp,
    subtitle: fieldProp,
    mediaDimensions: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      fit: PropTypes.oneOf(['clip', 'crop', 'fill', 'fillmax', 'max', 'scale', 'min']),
      aspect: PropTypes.number,
    }),
    status: fieldProp,
    media: fieldProp,
    isPlaceholder: PropTypes.bool,
    children: PropTypes.node,
    styles: PropTypes.object,
    progress: PropTypes.number
  }

  static defaultProps = {
    title: 'Untitled',
    subtitle: undefined,
    progress: undefined,
    media: undefined,
    mediaDimensions: {width: 80, height: 80, aspect: 1, fit: 'crop'}
  }

  render() {
    const {
      title,
      subtitle,
      media,
      children,
      status,
      isPlaceholder,
      progress,
      mediaDimensions,
      styles
    } = this.props

    if (isPlaceholder) {
      return (
        <div className={styles.placeholder}>
          <div className={styles.media} />
          <div className={styles.heading}>
            <h2 className={styles.title}>Loading…</h2>
            <h3 className={styles.subtitle}>Loading…</h3>
          </div>
        </div>
      )
    }

    return (
      <div
        className={`
          ${styles.root}
          ${subtitle ? styles.hasSubtitle : ''}
          ${media ? styles.hasMedia : ''}
        `}
      >

        <div className={styles.media}>
          {
            typeof media === 'function' && (
              media({dimensions: mediaDimensions, layout: 'default'})
            )
          }
          {
            typeof media === 'string' && (
              <div className={styles.mediaString}>{media}</div>
            )
          }
          {
            React.isValidElement(media) && media
          }
        </div>

        <div className={styles.heading}>
          <h2 className={styles.title}>
            {
              typeof title !== 'function' && title
            }
            {
              typeof title === 'function' && title({layout: 'default'})
            }
          </h2>
          {
            subtitle && (
              <h3 className={styles.subtitle}>
                {
                  (typeof subtitle === 'function' && subtitle({layout: 'default'}))
                  || subtitle
                }
              </h3>
            )
          }
        </div>
        {
          status && (
            <div className={styles.status}>
              {
                (typeof status === 'function' && status({layout: 'default'}))
                || status
              }
            </div>
          )
        }
        {
          children && <div className={styles.children}>{children}</div>
        }
        {
          typeof progress === 'number' && progress > -1 && (
            <div className={styles.progress}>
              <div className={styles.progressBar} style={{width: `${progress}%`}} />
            </div>
          )
        }
      </div>
    )
  }
}

export default Styleable(DefaultPreview, defaultStyles)
