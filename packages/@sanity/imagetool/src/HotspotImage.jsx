/* eslint-disable react/jsx-filename-extension */
import PropTypes from 'prop-types'
import React from 'react'
import Debug from 'debug'
import {debounce} from 'lodash'
import calculateStyles from './calculateStyles'
import {DEFAULT_HOTSPOT, DEFAULT_CROP} from './constants'
import {RootContainer} from './HotspotImage.styles'

const debug = Debug('sanity-imagetool')

function getCropAspect(crop, srcAspect) {
  const origHeight = 1 / srcAspect
  const origWidth = srcAspect * origHeight
  const cropWidth = origWidth - (crop.left + crop.right) * origWidth
  const cropHeight = origHeight - (crop.top + crop.bottom) * origHeight
  return cropWidth / cropHeight
}

export default class HotspotImage extends React.PureComponent {
  static propTypes = {
    src: PropTypes.string.isRequired,
    srcAspectRatio: PropTypes.number.isRequired,
    srcSet: PropTypes.string,
    hotspot: PropTypes.shape({
      _type: PropTypes.string,
      width: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired,
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
    }),
    crop: PropTypes.shape({
      _type: PropTypes.string.isRequired,
      bottom: PropTypes.number.isRequired,
      left: PropTypes.number.isRequired,
      right: PropTypes.number.isRequired,
      top: PropTypes.number.isRequired,
    }),
    aspectRatio: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['auto', 'none'])]),
    alignX: PropTypes.oneOf(['center', 'left', 'right']),
    alignY: PropTypes.oneOf(['center', 'top', 'bottom']),
    className: PropTypes.string,
    style: PropTypes.object,
    alt: PropTypes.string,
    onError: PropTypes.func,
    onLoad: PropTypes.func,
  }

  static defaultProps = {
    alignX: 'center',
    alignY: 'center',
    className: '',
    crop: DEFAULT_CROP,
    hotspot: DEFAULT_HOTSPOT,
    aspectRatio: 'none',
  }

  state = {
    containerAspect: null,
  }

  componentDidMount() {
    const imageElement = this.imageElement
    // Fixes issues that may happen if the component is rendered on server and mounted after the image has finished loading
    // In these situations, neither the onLoad or the onError events will be called.
    // Derived from http://imagesloaded.desandro.com/
    const alreadyLoaded =
      imageElement.src && imageElement.complete && imageElement.naturalWidth !== undefined
    if (alreadyLoaded) {
      debug(
        "Image '%s' already loaded, refreshing (from cache) to trigger onLoad / onError",
        this.props.src
      )
      // eslint-disable-next-line no-self-assign
      imageElement.src = imageElement.src
    }

    this.updateContainerAspect(this.props)
    window.addEventListener('resize', this.handleResize)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.aspectRatio !== this.props.aspectRatio) {
      this.updateContainerAspect(nextProps)
    }
  }

  updateContainerAspect(props) {
    if (!this.containerElement) return
    if (props.aspectRatio === 'auto') {
      const parentNode = this.containerElement.parentNode
      this.setState({
        containerAspect: parentNode.offsetWidth / parentNode.offsetHeight,
      })
    } else {
      this.setState({
        containerAspect: null,
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

  setImageElement = (el) => {
    this.imageElement = el
  }

  handleResize = debounce(() => this.updateContainerAspect(this.props))

  setContainerElement = (el) => {
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
      alt,
      onError,
      onLoad,
    } = this.props

    const targetAspect = this.getTargetAspectValue()

    const targetStyles = calculateStyles({
      container: {aspectRatio: targetAspect},
      image: {aspectRatio: srcAspectRatio},
      hotspot,
      crop,
      align: {
        x: alignX,
        y: alignY,
      },
    })
    return (
      <RootContainer className={`${className}`} style={style} ref={this.setContainerElement}>
        <div style={targetStyles.container}>
          <div style={targetStyles.padding} />
          <div style={targetStyles.crop}>
            <img
              ref={this.setImageElement}
              src={src}
              alt={alt}
              srcSet={srcSet}
              onLoad={onLoad}
              onError={onError}
              style={targetStyles.image}
            />
          </div>
        </div>
      </RootContainer>
    )
  }
}
