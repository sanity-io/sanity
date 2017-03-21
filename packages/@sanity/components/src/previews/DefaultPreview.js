import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/previews/default-style'
import MediaRender from './common/MediaRender.js'
import getPlaceholderItemStyles from './common/getPlaceholderItemStyles'

let index = 0

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

  index = index++

  render() {
    const {item, assetSize, emptyText, children, isPlaceholder} = this.props

    if (!item || isPlaceholder) {
      const itemStyle = getPlaceholderItemStyles(this.index)
      return (
        <div className={`${styles.placeholder}`}>
          <div className={`${styles.media}`} />
          <div className={styles.heading}>
            <h2 className={styles.title} style={itemStyle.title} />
            <h3 className={styles.subtitle} style={itemStyle.subtitle} />
          </div>
          <div className={styles.animation} />
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
