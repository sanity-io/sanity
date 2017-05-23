import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/previews/block-style'
import MediaRender from './common/MediaRender.js'

export default class BlockPreview extends React.Component {
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
    children: PropTypes.node,
    type: PropTypes.shape({
      title: PropTypes.string,
      name: PropTypes.string
    })
  }

  static defaultProps = {
    emptyText: '',
    assetSize: {width: 140, height: 140},
  }

  render() {
    const {item, emptyText, assetSize, children, type} = this.props

    if (!item) {
      return (
        <div className={`${styles.empty}`}>
          {emptyText}
        </div>
      )
    }

    return (
      <div
        className={`
          ${styles.root}
          ${item.subtitle ? styles.hasSubtitle : ''}
        `}
      >
        <div className={styles.type}>
          {type.title || type.name}
        </div>
        {
          (item.media || item.sanityImage || item.imageUrl) && <div className={`${styles.media}`}>
            <MediaRender size={assetSize} item={item} />
          </div>
        }
        <div className={styles.heading}>
          <h2 className={styles.title}>
            {item.title || emptyText}
          </h2>
          <h3 className={styles.subtitle}>
            {item.subtitle}
          </h3>
          {
            item.description && (
              <p className={styles.description}>
                {item.description}
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
