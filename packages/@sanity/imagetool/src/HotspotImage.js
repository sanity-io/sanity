import React, {PropTypes} from 'react'
import calculateStyles from './calculateStyles'
import Debug from 'debug'
import {DEFAULT_HOTSPOT, DEFAULT_CROP} from './constants'
import {debounce} from 'lodash'

const debug = Debug('sanity-imagetool')

function getCropAspect(crop, srcAspect) {
  const origHeight = (1 / srcAspect)
  const origWidth = srcAspect * origHeight
  const cropWidth = origWidth - ((crop.left + crop.right) * origWidth)
  const cropHeight = origHeight - ((crop.top + crop.bottom) * origHeight)
  return cropWidth / cropHeight
}

export default class HotspotImage extends React.PureComponent {
  static propTypes = {
    src: React.PropTypes.string.isRequired,
    srcAspectRatio: PropTypes.number.isRequired,
    srcSet: React.PropTypes.string,
    hotspot: React.PropTypes.object.isRequired,
    crop: React.PropTypes.object.isRequired,
    width: React.PropTypes.number,
    aspectRatio: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.oneOf(['auto', 'none']),
    ]),
    alignX: PropTypes.oneOf(['center', 'left', 'right']),
    alignY: PropTypes.oneOf(['center', 'top', 'bottom']),
    className: PropTypes.string,
    style: PropTypes.object,
    onError: PropTypes.func,
    onLoad: PropTypes.func
  }

  static defaultProps = {
    alignX: 'center',
    alignY: 'center',
    crop: DEFAULT_CROP,
    hotspot: DEFAULT_HOTSPOT,
    aspectRatio: 'none'
  }

  state = {
    containerAspect: null
  }

  componentDidMount() {
    const imageElement = this.imageElement
    // Fixes issues that may happen if the component is rendered on server and mounted after the image has finished loading
    // In these situations, neither the onLoad or the onError events will be called.
    // Derived from http://imagesloaded.desandro.com/
    const alreadyLoaded = (imageElement.src && imageElement.complete && imageElement.naturalWidth !== undefined)
    if (alreadyLoaded) {
      debug("Image '%s' already loaded, refreshing (from cache) to trigger onLoad / onError", this.props.src)
      imageElement.src = imageElement.src
    }

    this.updateContainerAspect(this.props)
    window.addEventListener('resize', this.handleResize)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.aspectRatio !== this.props.aspectRatio) {
      this.updateContainerAspect(nextProps)
    }
  }

  updateContainerAspect(props) {
    if (props.aspectRatio === 'auto') {
      const parentNode = this.containerElement.parentNode
      this.setState({
        containerAspect: parentNode.offsetWidth / parentNode.offsetHeight
      })
    } else {
      this.setState({
        containerAspect: null
      })
    }
  }

  getTargetAspectValue() {
    const {aspectRatio, srcAspectRatio, crop} = this.props

    if (aspectRatio === 'none') {
      return getCropAspect(crop, srcAspectRatio)
    }
    if (aspectRatio === 'auto') {
      return this.state.containerAspect
    }
    return aspectRatio
  }

  setImageElement = el => {
    this.imageElement = el
  }

  handleResize = debounce(() => this.updateContainerAspect(this.props))

  setContainerElement = el => {
    this.containerElement = el
  }

  render() {
    const {
      srcAspectRatio,
      crop,
      hotspot,
      src,
      srcSet,
      alignX,
      alignY,
      className,
      style,
      onError,
      onLoad
    } = this.props

    const targetAspect = this.getTargetAspectValue()

    const targetStyles = calculateStyles({
      container: {aspectRatio: targetAspect},
      image: {aspectRatio: srcAspectRatio},
      hotspot,
      crop,
      align: {
        x: alignX,
        y: alignY
      }
    })
    return (
      <div className={className} style={style} ref={this.setContainerElement}>
        <div style={targetStyles.container}>
          <div style={targetStyles.padding} />
          <div style={targetStyles.crop}>
            <img
              ref={this.setImageElement}
              src={src}
              srcSet={srcSet}
              onLoad={onLoad}
              onError={onError}
              style={targetStyles.image}
            />
          </div>
        </div>
      </div>
    )
  }
}
