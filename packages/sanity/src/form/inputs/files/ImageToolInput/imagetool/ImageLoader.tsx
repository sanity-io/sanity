import React from 'react'

interface ImageLoaderProps {
  src: string
  children: (props: {
    isLoading: boolean
    image: HTMLImageElement | null
    error: Error | null
  }) => React.ReactNode
}
interface ImageLoaderState {
  isLoading: boolean
  image: HTMLImageElement | null
  error: Error | null
}

export class ImageLoader extends React.Component<ImageLoaderProps, ImageLoaderState> {
  state: ImageLoaderState = {
    isLoading: true,
    image: null,
    error: null,
  }

  UNSAFE_componentWillMount() {
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

    image.referrerPolicy = 'strict-origin-when-cross-origin'
    image.src = src
  }

  UNSAFE_componentWillReceiveProps(nextProps: ImageLoaderProps) {
    if (nextProps.src !== this.props.src) {
      this.loadImage(nextProps.src)
    }
  }

  render() {
    const {error, image, isLoading} = this.state
    return this.props.children({image, error, isLoading})
  }
}
