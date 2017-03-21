import React, {PropTypes} from 'react'
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
    children: PropTypes.node
  }

  static defaultProps = {
    emptyText: 'Untitled',
    assetSize: {width: 140, height: 140},
  }

  render() {
    const {item, emptyText, assetSize, children} = this.props

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
        {
          (item.media || item.sanityImage || item.imageUrl) && <div className={`${styles.media}`}>
            <MediaRender size={assetSize} item={item} />
          </div>
        }
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
