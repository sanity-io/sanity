import PropTypes from 'prop-types'
import React from 'react'
import Observable from '@sanity/observable/minimal'

// http://probablyprogramming.com/2009/03/15/the-tiniest-gif-ever
const PROBABLY_THE_TINIEST_GIF_EVER = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
const noop = () => {}

function isLocalFile(src) {
  return src.startsWith('blob:')
}

function loadImage(src) {
  return new Observable(observer => {
    const image = document.createElement('img')
    let loaded = false
    const onload = () => {
      loaded = true
      observer.next(image)
      observer.complete()
    }
    const onerror = () => {
      observer.error(new Error(`Could not load image from ${isLocalFile(src) ? 'local file' : src}`))
    }

    image.onload = onload
    image.onerror = onerror

    image.src = src
    return () => {
      image.onload = image.onerror = noop
      if (!loaded) {
        image.src = PROBABLY_THE_TINIEST_GIF_EVER
      }
    }
  })
}

export default class ImageLoader extends React.PureComponent {
  static propTypes = {
    src: PropTypes.string.isRequired,
    children: PropTypes.func
  }

  state = {
    loadedImage: null,
    error: null
  }

  componentWillMount() {
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

  loadImage(src) {
    this.unsubscribe()
    this.subscription = loadImage(src).subscribe({
      next: url => this.setState({loadedImage: url, error: null}),
      error: error => this.setState({loadImage: null, error: error})
    })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.src !== this.props.src) {
      this.loadImage(nextProps.src)
    }
  }

  render() {
    const {children} = this.props
    const {error, loadedImage} = this.state
    return (error || loadedImage) ? children({image: loadedImage, error}) : null
  }
}
