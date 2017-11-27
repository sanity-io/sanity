import PropTypes from 'prop-types'
import React from 'react'
import defaultStyles from 'part:@sanity/components/previews/default-style'
import SvgPlaceholder from './common/SvgPlaceholder'
import Styleable from '../utilities/Styleable'

const PLACEHOLDER = (
  <div className={defaultStyles.root}>
    <SvgPlaceholder styles={defaultStyles} />
  </div>
)

class DefaultPreview extends React.PureComponent {
  static propTypes = {
    title: PropTypes.oneOf([PropTypes.string, PropTypes.node]),
    subtitle: PropTypes.oneOf([PropTypes.string, PropTypes.node]),
    mediaDimensions: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      fit: PropTypes.oneOf(['clip', 'crop', 'clamp']),
      aspect: PropTypes.number,
    }),
    renderMedia: PropTypes.func,
    status: PropTypes.oneOf([PropTypes.string, PropTypes.node]),
    isPlaceholder: PropTypes.bool,
    children: PropTypes.node,
    styles: PropTypes.object,
    progress: PropTypes.number
  }

  static defaultProps = {
    title: 'Untitled',
    mediaDimensions: {width: 40, height: 40, aspect: 1, fit: 'crop'},
    subtitle: undefined,
    progress: undefined,
  }

  render() {
    const {
      title,
      subtitle,
      renderMedia,
      mediaDimensions,
      children,
      status,
      isPlaceholder,
      progress,
      styles
    } = this.props

    if (isPlaceholder) {
      return (
        <div>
          {PLACEHOLDER}
        </div>
      )
    }

    return (
      <div
        className={`
          ${styles.root}
          ${subtitle ? styles.hasSubtitle : ''}
          ${renderMedia ? styles.hasMedia : ''}
        `}
      >
        {
          renderMedia && (
            <div className={`${styles.media}`}>
              {renderMedia(mediaDimensions)}
            </div>
          )
        }
        <div className={styles.heading}>
          <h2 className={styles.title}>
            {title}
          </h2>
          {
            subtitle && (
              <h3 className={styles.subtitle}>
                {subtitle}
              </h3>
            )
          }
        </div>
        <div className={styles.status}>{status}</div>
        {
          children && <div className={styles.children}>{children}</div>
        }
        {
          progress && (
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
