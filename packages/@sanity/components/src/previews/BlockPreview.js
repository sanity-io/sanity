import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/previews/block-style'

export default class BlockPreview extends React.PureComponent {
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
    type: PropTypes.shape({
      title: PropTypes.string,
      name: PropTypes.string
    })
  }

  static defaultProps = {
    mediaDimensions: {width: 160, height: 160, aspect: 1, fit: 'crop'}
  }

  render() {
    const {
      title,
      subtitle,
      description,
      mediaDimensions,
      renderMedia,
      children,
      type
    } = this.props

    return (
      <div
        className={styles.root}
      >
        <div className={styles.type}>
          {type.title || type.name}
        </div>
        {
          renderMedia && (
            <div className={styles.media}>
              {renderMedia(mediaDimensions)}
            </div>
          )
        }
        <div className={styles.heading}>
          <h2 className={styles.title}>
            {title}
          </h2>
          <h3 className={styles.subtitle}>
            {subtitle}
          </h3>
          {
            description && (
              <p className={styles.description}>
                {description}
              </p>
            )
          }
        </div>

        {
          children && <div className={styles.children}>{children}</div>
        }
      </div>
    )
  }
}
