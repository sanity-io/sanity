import React from 'react'
import {Subscription} from 'rxjs'
import {loadImage} from './loadImage'

interface ImageLoaderProps {
  src: string
  children: (props: {image: HTMLImageElement | null; error: Error | null}) => React.ReactNode
}

interface State {
  loadedImage: HTMLImageElement | null
  error: Error | null
}

// @todo: refactor to functional component
export default class ImageLoader extends React.PureComponent<ImageLoaderProps, State> {
  state = {
    loadedImage: null,
    error: null
  }

  subscription?: Subscription

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    this.loadImage(this.props.src)
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  loadImage(src: string) {
    this.unsubscribe()
    this.subscription = loadImage(src).subscribe({
      next: url => this.setState({loadedImage: url, error: null}),
      error: error => this.setState({loadedImage: null, error: error})
    })
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps: ImageLoaderProps) {
    if (nextProps.src !== this.props.src) {
      this.loadImage(nextProps.src)
    }
  }

  render() {
    const {children} = this.props
    const {error, loadedImage} = this.state

    return error || loadedImage ? children({image: loadedImage, error}) : null
  }
}
