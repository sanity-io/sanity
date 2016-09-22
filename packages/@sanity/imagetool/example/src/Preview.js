import React, {PropTypes} from 'react'
import HotspotImage from '../../src/HotspotImage'
import calculateStyles from '../../src/calculateStyles'

/**
 * Takes an imageUrl and a hotspot object and returns an optimal previews of the image
 */

export default React.createClass({
  displayName: 'HotspotPreview',
  propTypes: {
    imageUrl: PropTypes.string,
    hotspot: PropTypes.shape({
      height: PropTypes.number,
      width: PropTypes.number,
      x: PropTypes.number,
      y: PropTypes.number,
    }),
    crop: PropTypes.shape({
      top: PropTypes.number,
      left: PropTypes.number,
      bottom: PropTypes.number,
      right: PropTypes.number
    }),
    width: PropTypes.number,
    height: PropTypes.number,
    aspectRatio: PropTypes.number,
  },
  getInitialState() {
    return {
      loaded: false,
      imageSize: null,
      error: null
    }
  },
  handleImageLoadError(error) {
    this.setState({
      loaded: false,
      error: error
    })
  },
  handleImageLoaded(e) {
    const {width, height} = e.target
    this.setState({
      loaded: true,
      error: null,
      imageSize: {
        width: width,
        height: height,
        ratio: width / height
      }
    })
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.imageUrl !== this.props.imageUrl) {
      this.setState(this.getInitialState())
    }
  },

  render() {
    const {imageUrl, hotspot, crop, width, aspectRatio} = this.props
    const {error, loaded, imageSize} = this.state
    if (error) {
      return (
        <div>Image load error: {error.message}</div>
      )
    }
    if (!loaded) {
      return (
        <div style={{overflow: 'hidden', height: 1, width: 1}}>
          <img src={this.props.imageUrl} onLoad={this.handleImageLoaded} onError={this.handleImageLoadError} />
        </div>
      )
    }

    const imageAspectRatio = imageSize.width / imageSize.height
    const styles = calculateStyles({
      container: {aspectRatio},
      image: {aspectRatio: imageAspectRatio},
      hotspot: hotspot,
      crop: crop,
      align: {
        x: 'center',
        y: 'center'
      }
    })

    return (
      <div style={{border: '1px solid #eee'}}>
        <pre>{JSON.stringify(styles, null, 2)}</pre>
        <HotspotImage
          src={imageUrl}
          srcAspectRatio={imageAspectRatio}
          aspectRatio={aspectRatio}
          crop={crop}
          hotspot={hotspot}
          alignX="center"
          alignY="center"
          style={{outline: '1px solid rgb(189, 240, 164)', width: width || '100%'}}
        />
      </div>
    )
  }
})
