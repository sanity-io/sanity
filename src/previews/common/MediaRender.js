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


    return (
      <div className={styles.root}>
        {
          imageUrl && (
            <img src={imageUrl} className={imageAspect > containerAspect ? styles.landscape : styles.portrait} />
          )
        }
        {
          sanityImage && (
            <div className={styles.sanityImage}>SanityImage</div>
          )
        }

        {
          media && (
            <div className={styles.media}>
              {media}
            </div>
          )
        }

      </div>
    )
  }
}
