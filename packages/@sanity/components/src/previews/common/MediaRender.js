import PropTypes from 'prop-types'
import React from 'react'
import assetUrlBuilder from 'part:@sanity/base/asset-url-builder'
import styles from './MediaRender.css'
import ImageLoader from '../../utilities/ImageLoader'

export default class MediaRender extends React.Component {
  static propTypes = {
    aspect: PropTypes.number,
    fallbackText: PropTypes.string,
    size: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      fit: PropTypes.oneOf(['clip', 'crop', 'clamp'])
    }),
    item: PropTypes.shape({
      media: PropTypes.node,
      imageUrl: PropTypes.string,
      sanityImage: PropTypes.object,
      aspect: PropTypes.number
    })
  }

  static defaultProps = {
    size: {width: 100},
    fallbackText: 'Nothing here…',
    aspect: 1
  }

  state = {
    aspect: null
  }

  getAssetUrl() {
    const devicePixelRatio = window.devicePixelRatio || 1
    const size = {
      height: Math.round(this.props.size.height * devicePixelRatio),
      width: Math.round(this.props.size.width * devicePixelRatio)
    }
    return assetUrlBuilder({...size, url: this.props.item.imageUrl})
  }

  render() {
    const {item, fallbackText, aspect: containerAspect} = this.props
    const {media, imageUrl, sanityImage} = item

    if (imageUrl) {
      return (
        <div className={styles.root}>
          <ImageLoader src={this.getAssetUrl(imageUrl)}>
            {({image}) => (
              <img
                src={image.src}
                className={(item.aspect || image.width / image.height || 1) > containerAspect ? styles.landscape : styles.portrait}
              />
            )}
          </ImageLoader>
        </div>
      )
    } else if (sanityImage) {
      return <div className={styles.sanityImage}>SanityImage</div>
    } else if (media) {
      return <div className={styles.media}>{media}</div>
    }

    return (
      <div className={styles.root}>
        <div className={styles.noMedia}>
          <div className={styles.noMediaText}>
            {fallbackText}
          </div>
        </div>
      </div>
    )
  }
}
