/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/TemplatePreview.css'

const fieldProp = PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.func])

class TemplatePreview extends React.PureComponent {
  static propTypes = {
    title: fieldProp,
    subtitle: fieldProp,
    media: fieldProp,
    icon: PropTypes.func,
    isPlaceholder: PropTypes.bool,
    href: PropTypes.string,
    mediaDimensions: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      fit: PropTypes.oneOf(['clip', 'crop', 'fill', 'fillmax', 'max', 'scale', 'min']),
      aspect: PropTypes.number
    })
  }

  static defaultProps = {
    title: 'Untitled',
    subtitle: undefined,
    href: undefined,
    icon: undefined,
    media: undefined,
    mediaDimensions: {width: 80, height: 80, aspect: 1, fit: 'crop'}
  }

  render() {
    const {
      href,
      title,
      subtitle,
      media = this.props.icon,
      isPlaceholder,
      mediaDimensions
    } = this.props

    if (isPlaceholder || !href) {
      return (
        <div className={styles.placeholder}>
          <div className={styles.heading}>
            <h2 className={styles.title}>Loading…</h2>
            <h3 className={styles.subtitle}>Loading…</h3>
          </div>
          {media !== false && <div className={styles.media} />}
        </div>
      )
    }

    return (
      <a className={styles.root} href={href} title={`Create new ${title} (${subtitle})`}>
        {media !== false && (
          <div className={styles.media}>
            {typeof media === 'function' && media({dimensions: mediaDimensions, layout: 'default'})}
            {typeof media === 'string' && <div className={styles.mediaString}>{media}</div>}
            {React.isValidElement(media) && media}
          </div>
        )}
        <div className={styles.heading}>
          <h2 className={styles.title}>
            {typeof title !== 'function' && title}
            {typeof title === 'function' && title({layout: 'default'})}
          </h2>
          {subtitle && (
            <h3 className={styles.subtitle}>
              {(typeof subtitle === 'function' && subtitle({layout: 'default'})) || subtitle}
            </h3>
          )}
        </div>
      </a>
    )
  }
}

export default TemplatePreview
