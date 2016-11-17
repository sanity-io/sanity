import React, {PropTypes} from 'react'
import styles from './MediaRender.css'

export default class MediaRender extends React.Component {
  static propTypes = {
    item: PropTypes.shape({
      media: PropTypes.node,
      imageUrl: PropTypes.string,
      sanityImage: PropTypes.object
    })
  }

  constructor(...args) {
    super(...args)
    this.state = {
      vanillaAspect: null
    }
  }

  componentWillMount() {
    // this._inputId = uniqueId('ImageInputFieldset')
  }

  componentDidMount() {
    const {imageUrl} = this.props.item

    if (imageUrl) {
      this.renderImage(imageUrl)
    }
  }

  renderImage = url => {
    const image = new Image()
    image.src = url
    image.onload = i => {
      this.setState({
        vanillaAspect: image.width / image.height
      })
    }
  }

  static defaultProps = {
    emptyText: 'Nothing here…',
  }

  render() {
    const {media, imageUrl, sanityImage} = this.props.item
    const {vanillaAspect} = this.state

    return (
      <div className={`${styles.root}`}>
        {
          imageUrl && vanillaAspect && (
            <img src={imageUrl} className={vanillaAspect >= 1 ? styles.vanillaImageLandscape : styles.vanillaImagePortrait} />
          )
        }

        {
          sanityImage && <div>SanityImage</div>
        }

        {
          media && <div>
            <media />
          </div>
        }

      </div>
    )
  }
}
