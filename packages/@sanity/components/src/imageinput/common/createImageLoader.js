import React, {PropTypes} from 'react'
import Snackbar from 'part:@sanity/components/snackbar/default'

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
        if (this.props.src.split('blob:http').length > 1) {
          this.setState({
            error: new Error('Could not preview image from your computer')
          })
        } else {
          this.setState({
            error: new Error(`Could not preview image from ${JSON.stringify(this.props.src)}`)
          })
        }
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
        return <Snackbar kind="danger">{error.message}</Snackbar>
      }
      if (!loadedImage) {
        return null
      }
      return <Component {...this.props} {...mapImageToProps(loadedImage)} />
    }
  }
}
