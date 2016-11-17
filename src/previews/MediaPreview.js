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
      sanityImage: PropTypes.object
    }),
    emptyText: PropTypes.string,
    children: PropTypes.node
  }

  static defaultProps = {
    emptyText: 'Nothing here…',
  }

  render() {
    const {item, emptyText, children} = this.props

    if (!item) {
      return (
        <div className={`${styles.empty}`}>
          {emptyText}
        </div>
      )
    }

    return (
      <div className={`${styles.root}`}>

        {
          (item.media || item.sanityImage || item.imageUrl) && <div className={`${styles.media}`}>
            <MediaRender item={item} />
          </div>
        }
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
