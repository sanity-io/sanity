import React, {PropTypes} from 'react'
import ImageTool from './ImageTool'

export default class ImageToolLoadImageProxy extends React.PureComponent {
  static propTypes = {
    imageUrl: PropTypes.string.isRequired
  }

  state = {
    loadedImage: null,
    error: null
  }

  componentWillMount() {
    this.loadImage(this.props.imageUrl)
  }

  loadImage(imageUrl) {
    const image = new Image()

    image.onload = () => {
      this.setState({
        loadedImage: image,
        error: null
      })
    }

    image.onerror = () => {
      this.setState({
        error: new Error(`Could not load image from ${JSON.stringify(this.props.imageUrl)}`)
      })
    }

    image.src = imageUrl
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.imageUrl !== this.props.imageUrl) {
      this.loadImage(nextProps.imageUrl)
    }
  }

  render() {
    const {error, loadedImage} = this.state
    if (error) {
      return <div style={{display: 'inline-block'}}>{error.message}</div>
    }
    if (!loadedImage) {
      return null
    }
    return <ImageTool {...this.props} image={loadedImage} />
  }
}
