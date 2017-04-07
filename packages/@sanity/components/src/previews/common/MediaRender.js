import React, {PropTypes} from 'react'
import assetUrlBuilder from 'part:@sanity/base/asset-url-builder'
import styles from './MediaRender.css'

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
  }

  constructor(...args) {
    super(...args)
    this.state = {
      aspect: null
    }
  }

  componentWillMount() {
    // this._inputId = uniqueId('ImageInputFieldset')
  }

  componentDidMount() {
    const {imageUrl, aspect} = this.props.item

    if (imageUrl && !aspect) {
      this.renderImage(this.getAssetUrl(imageUrl))
    }
  }

  getAssetUrl() {
    const devicePixelRatio = window.devicePixelRatio || 1
    const size = {
      height: this.props.size.height * devicePixelRatio,
      width: this.props.size.width * devicePixelRatio
    }
    return assetUrlBuilder({...size, url: this.props.item.imageUrl})
  }

  renderImage = url => {
    const image = new Image()
    image.src = url
    image.onload = i => {
      this.setState({
        aspect: image.width / image.height
      })
    }
  }

  render() {
    const {item, fallbackText} = this.props
    const {media, imageUrl, sanityImage} = item

    const containerAspect = this.props.aspect || 1
    const imageAspect = this.props.item.aspect || this.state.aspect || 1

    if (imageUrl) {
      return (
        <div className={styles.root}>
          <img
            src={this.getAssetUrl(imageUrl)}
            className={imageAspect > containerAspect ? styles.landscape : styles.portrait}
          />
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
