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
    assetSize: {width: 40, height: 40},
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
      <span className={`${styles.root}`}>
        {
          (item.media || item.sanityImage || item.imageUrl) && (
            <span className={`${styles.media}`}>
              <MediaRender size={assetSize} item={item} />
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
