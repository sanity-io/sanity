import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/previews/default-style'
import MediaRender from './common/MediaRender.js'
import SvgPlaceholder from './common/SvgPlaceholder'

const PLACEHOLDER = (
  <div className={styles.root}>
    <SvgPlaceholder styles={styles} />
  </div>
)

export default class DefaultPreview extends React.Component {
  static propTypes = {
    item: PropTypes.shape({
      title: PropTypes.string,
      subtitle: PropTypes.string,
      description: PropTypes.string,
      media: PropTypes.node,
      imageUrl: PropTypes.string,
      sanityImage: PropTypes.object
    }),
    assetSize: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      fit: PropTypes.oneOf(['clip', 'crop', 'clamp'])
    }),
    emptyText: PropTypes.string,
    isPlaceholder: PropTypes.bool,
    children: PropTypes.node
  }

  static defaultProps = {
    emptyText: 'Untitled',
    assetSize: {width: 40, height: 40}
  }

  render() {
    const {item, assetSize, emptyText, children, isPlaceholder} = this.props

    if (!item || isPlaceholder) {
      return PLACEHOLDER
    }

    return (
      <div
        className={`
          ${styles.root}
          ${item.subtitle ? styles.hasSubtitle : ''}
        `}
      >
        <div className={`${styles.media}`}>
          {
            (item.media || item.sanityImage || item.imageUrl) && (
              <MediaRender size={assetSize} item={item} />
            )
          }
        </div>
        <div className={styles.heading}>
          <h2 className={styles.title}>
            {item.title || emptyText}
          </h2>
          {
            item.subtitle && <h3 className={styles.subtitle}>
              {item.subtitle}
            </h3>
          }
        </div>
        {
          children && <div className={styles.children}>{children}</div>
        }
      </div>
    )
  }
}
