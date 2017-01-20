import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/previews/inline-style'
import MediaRender from './common/MediaRender.js'

export default class InlinePreview extends React.Component {
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
    emptyText: 'Untitled',
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
      <span className={`${styles.root}`}>
        {
          (item.media || item.sanityImage || item.imageUrl) && (
            <span className={`${styles.media}`}>
              <MediaRender item={item} />
            </span>
          )
        }
        <span className={styles.title}>
          {item.title || emptyText}
        </span>
        {children && <span>{children}</span>}
      </span>
    )
  }
}
