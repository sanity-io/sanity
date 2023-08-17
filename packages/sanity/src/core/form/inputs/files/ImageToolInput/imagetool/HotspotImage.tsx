import React, {
  memo,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Debug from 'debug'
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

export const HotspotImage = memo(function HotspotImage(props: HotspotImageProps) {
  const {
    alignX = 'center',
    alignY = 'center',
    alt,
    aspectRatio = 'none',
    className = '',
    crop = DEFAULT_CROP,
    hotspot = DEFAULT_HOTSPOT,
    onError,
    onLoad,
    src,
    srcAspectRatio,
    srcSet,
    style,
  } = props
  const [containerAspect, setContainerAspect] = useState<number | null>(null)
  const containerElementRef = useRef<HTMLDivElement | null>(null)
  const imageElementRef = useRef<HTMLImageElement | null>(null)

  const updateContainerAspect = useCallback(() => {
    if (!containerElementRef.current) return
    if (aspectRatio === 'auto') {
      const parentNode = containerElementRef.current.parentNode as HTMLElement
      startTransition(() => setContainerAspect(parentNode.offsetWidth / parentNode.offsetHeight))
    } else {
      setContainerAspect(null)
    }
  }, [aspectRatio])

  useEffect(() => {
    const imageElement = imageElementRef.current

    // Fixes issues that may happen if the component is rendered on server and mounted after the image has finished loading
    // In these situations, neither the onLoad or the onError events will be called.
    // Derived from http://imagesloaded.desandro.com/
    const alreadyLoaded =
      imageElement &&
      imageElement.src &&
      imageElement.complete &&
      imageElement.naturalWidth !== undefined

    if (alreadyLoaded) {
      debug("Image '%s' already loaded, refreshing (from cache) to trigger onLoad / onError", src)
      // eslint-disable-next-line no-self-assign
      imageElement.src = imageElement.src
    }

    updateContainerAspect()

    window.addEventListener('resize', updateContainerAspect)

    return () => {
      window.removeEventListener('resize', updateContainerAspect)
    }
  }, [src, updateContainerAspect])

  const targetAspect = useMemo(() => {
    if (aspectRatio === 'none') {
      return crop ? getCropAspect(crop, srcAspectRatio) : srcAspectRatio
    }

    if (aspectRatio === 'auto') {
      return containerAspect
    }

    return aspectRatio || null
  }, [aspectRatio, containerAspect, crop, srcAspectRatio])

  const targetStyles = useMemo(
    () =>
      calculateStyles({
        container: {aspectRatio: targetAspect || srcAspectRatio},
        image: {aspectRatio: srcAspectRatio},
        hotspot,
        crop,
        align: {
          x: alignX,
          y: alignY,
        },
      }),
    [alignX, alignY, crop, hotspot, srcAspectRatio, targetAspect],
  )

  return (
    <HotspotImageContainer className={`${className}`} style={style} ref={containerElementRef}>
      <div style={targetStyles.container}>
        <div style={targetStyles.padding} />
        <div style={targetStyles.crop}>
          <img
            ref={imageElementRef}
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
})
