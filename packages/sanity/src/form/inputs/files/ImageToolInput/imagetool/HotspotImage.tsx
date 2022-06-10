import React from 'react'
import Debug from 'debug'
import {debounce} from 'lodash'
import {calculateStyles} from './calculateStyles'
import {DEFAULT_HOTSPOT, DEFAULT_CROP} from './constants'
import {HotspotImageContainer} from './HotspotImage.styles'
import type {Crop, Hotspot} from './types'

const debug = Debug('sanity-imagetool')

function getCropAspect(crop: Crop, srcAspect: number) {
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
  hotspot?: Hotspot
  crop?: Crop
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
  containerAspect: number | null
}
export class HotspotImage extends React.PureComponent<HotspotImageProps, HotspotImageState> {
  static defaultProps = {
    alignX: 'center',
    alignY: 'center',
    className: '',
    crop: DEFAULT_CROP,
    hotspot: DEFAULT_HOTSPOT,
    aspectRatio: 'none',
  }

  state: HotspotImageState = {
    containerAspect: null,
  }

  containerElement: HTMLDivElement | null = null
  imageElement: HTMLImageElement | null = null

  componentDidMount() {
    const imageElement = this.imageElement

    // Fixes issues that may happen if the component is rendered on server and mounted after the image has finished loading
    // In these situations, neither the onLoad or the onError events will be called.
    // Derived from http://imagesloaded.desandro.com/
    const alreadyLoaded =
      imageElement &&
      imageElement.src &&
      imageElement.complete &&
      imageElement.naturalWidth !== undefined

    if (alreadyLoaded) {
      debug(
        "Image '%s' already loaded, refreshing (from cache) to trigger onLoad / onError",
        this.props.src
      )
      // eslint-disable-next-line no-self-assign
      imageElement.src = imageElement.src
    }

    this.updateContainerAspect(this.props)

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize)
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize)
    }
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps: HotspotImageProps) {
    if (nextProps.aspectRatio !== this.props.aspectRatio) {
      this.updateContainerAspect(nextProps)
    }
  }

  updateContainerAspect(props: HotspotImageProps) {
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
      return crop ? getCropAspect(crop, srcAspectRatio) : srcAspectRatio
    }

    if (aspectRatio === 'auto') {
      return this.state.containerAspect
    }

    return aspectRatio || null
  }

  setImageElement = (el: HTMLImageElement | null) => {
    this.imageElement = el
  }

  handleResize = debounce(() => this.updateContainerAspect(this.props))

  setContainerElement = (el: HTMLDivElement | null) => {
    this.containerElement = el
  }

  render() {
    const {
      srcAspectRatio,
      crop,
      hotspot,
      src,
      srcSet,
      alignX = 'center',
      alignY = 'center',
      className,
      style,
      alt,
      onError,
      onLoad,
    } = this.props

    const targetAspect = this.getTargetAspectValue()

    const targetStyles = calculateStyles({
      container: {aspectRatio: targetAspect || srcAspectRatio},
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
        ref={this.setContainerElement}
      >
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
      </HotspotImageContainer>
    )
  }
}
