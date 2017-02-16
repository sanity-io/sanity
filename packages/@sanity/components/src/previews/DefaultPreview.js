import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/previews/default-style'
import MediaRender from './common/MediaRender.js'

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
    emptyText: PropTypes.string,
    isPlaceholder: PropTypes.bool,
    children: PropTypes.node
  }

  static defaultProps = {
    emptyText: 'Untitled',
    mediaRender() {
      return false
    }
  }

  render() {
    const {item, emptyText, children, isPlaceholder} = this.props

    if (!item || isPlaceholder) {
      return (
        <div className={`${styles.placeholder}`}>
          <div className={`${styles.media}`} />
          <div className={styles.heading}>
            <h2 className={styles.title} style={{width: `${(Math.random() * 80) + 15}%`}} />
            <h3 className={styles.subtitle} style={{width: `${(Math.random() * 20) + 75}%`}} />
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
            <MediaRender item={item} />
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
