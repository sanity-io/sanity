import PropTypes from 'prop-types'
import React from 'react'

export default class ImageLoader extends React.Component {
  static propTypes = {
    src: PropTypes.string.isRequired,
    children: PropTypes.func.isRequired,
  }

  state = {
    isLoading: true,
    image: null,
    error: null,
  }

  UNSAFE_componentWillMount() {
    this.loadImage(this.props.src)
  }

  loadImage(src) {
    const image = new Image()
    this.setState({
      image: null,
      error: null,
    })

    image.onload = () => {
      this.setState({
        image: image,
        error: null,
        isLoading: false,
      })
    }

    image.onerror = () => {
      this.setState({
        error: new Error(`Could not load image from ${JSON.stringify(this.props.src)}`),
        isLoading: false,
      })
    }

    image.src = src
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.src !== this.props.src) {
      this.loadImage(nextProps.src)
    }
  }

  render() {
    const {error, image, isLoading} = this.state
    return this.props.children({image, error, isLoading})
  }
}
