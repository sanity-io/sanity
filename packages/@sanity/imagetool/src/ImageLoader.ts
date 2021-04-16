import PropTypes from 'prop-types'
import React from 'react'

interface LoadState {
  isLoading: boolean
  image: null | HTMLImageElement
  error: null | Error
}

interface Props {
  src: string
  children: (loadState: LoadState) => React.ReactNode
}

export default class ImageLoader extends React.Component<Props> {
  static propTypes = {
    src: PropTypes.string.isRequired,
    children: PropTypes.func.isRequired,
  }

  state: LoadState = {
    isLoading: true,
    image: null,
    error: null,
  }

  componentDidMount() {
    this.loadImage(this.props.src)
  }

  loadImage(src: string) {
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

  componentDidUpdate(prevProps: Props) {
    if (this.props.src !== prevProps.src) {
      this.loadImage(this.props.src)
    }
  }

  render() {
    const {error, image, isLoading} = this.state
    return this.props.children({image, error, isLoading})
  }
}
