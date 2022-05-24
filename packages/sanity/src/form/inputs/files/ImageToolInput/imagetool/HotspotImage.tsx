/* eslint-disable react/jsx-filename-extension */
import PropTypes from 'prop-types'
import React from 'react'
import Debug from 'debug'
import {debounce} from 'lodash'
import {calculateStyles} from './calculateStyles'
import {DEFAULT_HOTSPOT, DEFAULT_CROP} from './constants'
import {HotspotImageContainer} from './HotspotImage.styles'
import {FIXME} from './types'

const debug = Debug('sanity-imagetool')

function getCropAspect(crop: FIXME, srcAspect: number) {
  const origHeight = 1 / srcAspect
  const origWidth = srcAspect * origHeight
  const cropWidth = origWidth - (crop.left + crop.right) * origWidth
  const cropHeight = origHeight - (crop.top + crop.bottom) * origHeight
  return cropWidth / cropHeight
}

export interface HotspotImageProps {
  src: string
  srcAspectRatio: number
  srcSet?: string
  hotspot?: {
    _type: 'sanity.imageHotspot' | string
    x: number
    y: number
    height: number
    width: number
  }
  crop?: {
    _type: 'sanity.imageCrop' | string
    top: number
    bottom: number
    left: number
    right: number
  }
  aspectRatio?: number | 'auto' | 'none'
  alignX?: 'left' | 'center' | 'right'
  alignY?: 'top' | 'center' | 'bottom'
  className?: string
  style?: React.CSSProperties
  alt?: string
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void
  onLoad?: () => void
}
export interface HotspotImageState {
  containerAspect?: number | null
}
export class HotspotImage extends React.PureComponent<HotspotImageProps, HotspotImageState> {
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

  state: FIXME = {
    containerAspect: null,
  }

  containerElement?: HTMLDivElement
  imageElement?: HTMLImageElement

  componentDidMount() {
    const imageElement: FIXME = this.imageElement
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
  UNSAFE_componentWillReceiveProps(nextProps: FIXME) {
    if (nextProps.aspectRatio !== this.props.aspectRatio) {
      this.updateContainerAspect(nextProps)
    }
  }

  updateContainerAspect(props: FIXME) {
    if (!this.containerElement) return
    if (props.aspectRatio === 'auto') {
      const parentNode = this.containerElement.parentNode as HTMLElement
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

  setImageElement = (el: HTMLImageElement | undefined) => {
    this.imageElement = el
  }

  handleResize = debounce(() => this.updateContainerAspect(this.props))

  setContainerElement = (el: HTMLDivElement | undefined) => {
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
      <HotspotImageContainer
        className={`${className}`}
        style={style}
        ref={this.setContainerElement as FIXME}
      >
        <div style={targetStyles.container as FIXME}>
          <div style={targetStyles.padding} />
          <div style={targetStyles.crop as FIXME}>
            <img
              ref={this.setImageElement as FIXME}
              src={src}
              alt={alt}
              srcSet={srcSet}
              onLoad={onLoad}
              onError={onError}
              style={targetStyles.image as FIXME}
            />
          </div>
        </div>
      </HotspotImageContainer>
    )
  }
}
