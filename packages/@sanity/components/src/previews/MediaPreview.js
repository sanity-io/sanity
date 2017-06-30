import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/previews/media-style'
import MediaRender from './common/MediaRender'
import Spinner from 'part:@sanity/components/loading/spinner'
import SvgPlaceholder from './common/SvgPlaceholder'

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
    assetSize: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      fit: PropTypes.oneOf(['clip', 'crop', 'clamp'])
    }),
    aspect: PropTypes.number,
    emptyText: PropTypes.string,
    children: PropTypes.node,
    isPlaceholder: PropTypes.bool
  }

  static defaultProps = {
    assetSize: {width: 120, height: 120},
    emptyText: 'Nothing here…',
    aspect: 1
  }

  render() {
    const {item, emptyText, assetSize, children, aspect, isPlaceholder} = this.props

    if (!item || isPlaceholder) {
      return (
        <div className={styles.root}>
          <div className={styles.padder} style={{paddingTop: `${100 / aspect}%`}} />
          <div className={styles.mediaContainer}>
            <SvgPlaceholder styles={styles} />
          </div>
        </div>
      )
    }

    return (
      <div className={styles.root} title={item.title || emptyText}>
        <div className={styles.padder} style={{paddingTop: `${100 / aspect}%`}} />
        <div className={styles.mediaContainer}>
          <MediaRender size={assetSize} item={item} aspect={aspect} fallbackText={item.title || 'No media'} />
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
