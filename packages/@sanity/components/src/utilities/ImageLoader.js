import PropTypes from 'prop-types'
import React from 'react'
import {loadImage} from './loadImage'

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
