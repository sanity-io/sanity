import PropTypes from 'prop-types'
import React from 'react'
import defaultStyles from 'part:@sanity/components/previews/default-style'
import SvgPlaceholder from './common/SvgPlaceholder'
import Styleable from '../utilities/Styleable'
import TextEllipsis from 'react-text-ellipsis'

const PLACEHOLDER = (
  <div className={defaultStyles.root}>
    <SvgPlaceholder styles={defaultStyles} />
  </div>
)

const fieldProp = PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.func])

class DefaultPreview extends React.PureComponent {
  static propTypes = {
    title: fieldProp,
    subtitle: fieldProp,
    mediaDimensions: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      fit: PropTypes.oneOf(['clip', 'crop', 'clamp']),
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
    title: 'Untitled…',
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
        <div className={media ? styles.hasMedia : ''}>
          {PLACEHOLDER}
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
        {
          media && (
            <div className={`${styles.media}`}>
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
                typeof media === 'object' && media
              }
            </div>
          )
        }
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
