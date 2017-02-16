import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/previews/media-style'
import MediaRender from './common/MediaRender'

export default class MediaPreview extends React.Component {
  static propTypes = {
    item: PropTypes.shape({
      title: PropTypes.string,
      subtitle: PropTypes.string,
      description: PropTypes.string,
      media: PropTypes.node,
      imageUrl: PropTypes.string,
      sanityImage: PropTypes.object,
    }),
    aspect: PropTypes.number,
    emptyText: PropTypes.string,
    children: PropTypes.node,
    isPlaceholder: PropTypes.bool
  }

  static defaultProps = {
    emptyText: 'Nothing here…',
    aspect: 1
  }

  render() {
    const {item, emptyText, children, aspect, isPlaceholder} = this.props

    if (!item || isPlaceholder) {
      return (
        <div className={`${styles.placeholder}`}>
          <div className={styles.mediaContainer} />
        </div>
      )
    }

    return (
      <div className={styles.root} title={item.title || emptyText}>
        <div className={styles.padder} style={{paddingTop: `${100 / aspect}%`}} />
        <div className={styles.mediaContainer}>
          <MediaRender item={item} aspect={aspect} />
        </div>
        <div className={`${styles.meta}`}>
          <div className={`${styles.metaInner}`}>
            <h2 className={styles.title}>
              {item.title || emptyText}
            </h2>
            {
              item.subtitle && <h3 className={styles.subtitle}>
                {item.subtitle}
              </h3>
            }
            <p className={styles.description}>{item.description}</p>
          </div>
        </div>
        {children}
      </div>
    )
  }
}
