import React, {PropTypes} from 'react'
import styles from './MediaRender.css'

export default class MediaRender extends React.Component {
  static propTypes = {
    aspect: PropTypes.number,
    item: PropTypes.shape({
      media: PropTypes.node,
      imageUrl: PropTypes.string,
      sanityImage: PropTypes.object,
      aspect: PropTypes.number
    })
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
      this.renderImage(imageUrl)
    }
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

  static defaultProps = {
    emptyText: 'Nothing here…',
  }

  render() {
    const {media, imageUrl, sanityImage} = this.props.item

    const containerAspect = this.props.aspect || 1
    const imageAspect = this.props.item.aspect || this.state.aspect || 1

    if (imageUrl) {
      return (
        <div className={styles.root}>
          <img
            src={imageUrl}
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
          <div className={styles.noMediaText}>No media</div>
        </div>
      </div>
    )
  }
}
