import PropTypes from 'prop-types'
import React from 'react'

export default function createImageLoadProxy(Component, {error: ErrorComponent, loader: LoaderComponent} = {}) {
  return class ImageLoadProxy extends React.Component {
    static displayName = `${Component.displayName || Component.name || '<Anonymous>'}$ImageLoadProxy`
    static propTypes = {
      src: PropTypes.string.isRequired
    }

    state = {
      image: null,
      error: null
    }

    componentWillMount() {
      this.loadImage(this.props.src)
    }

    loadImage(src) {
      const image = new Image()
      this.setState({
        image: null,
        error: null
      })

      image.onload = () => {
        this.setState({
          image: image,
          error: null
        })
      }

      image.onerror = () => {
        this.setState({error: new Error(`Could not load image from ${JSON.stringify(this.props.src)}`)})
      }

      image.src = src
    }

    componentWillReceiveProps(nextProps) {
      if (nextProps.src !== this.props.src) {
        this.loadImage(nextProps.src)
      }
    }

    render() {
      const {error, image} = this.state

      if (!error && !image) { // loading
        return LoaderComponent ? <LoaderComponent {...this.props} /> : null
      }
      if (error) {
        return ErrorComponent ? <ErrorComponent {...this.props} error={error} /> : null
      }
      return <Component {...this.props} image={image} />
    }
  }
}
