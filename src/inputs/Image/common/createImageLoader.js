import React, {PropTypes} from 'react'

export default function createImageLoader(Component, mapImageToProps) {
  return class ImageLoader extends React.PureComponent {
    static propTypes = {
      src: PropTypes.string.isRequired
    }

    state = {
      loadedImage: null,
      error: null
    }

    componentWillMount() {
      this.loadImage(this.props.src)
    }

    loadImage(src) {
      const image = new Image()

      image.onload = () => {
        this.setState({
          loadedImage: image,
          error: null
        })
      }

      image.onerror = () => {
        this.setState({
          error: new Error(`Could not load image from ${JSON.stringify(this.props.src)}`)
        })
      }

      image.src = src
    }

    componentWillReceiveProps(nextProps) {
      if (nextProps.src !== this.props.src) {
        this.loadImage(nextProps.src)
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
      return <Component {...this.props} {...mapImageToProps(loadedImage)} />
    }
  }
}
