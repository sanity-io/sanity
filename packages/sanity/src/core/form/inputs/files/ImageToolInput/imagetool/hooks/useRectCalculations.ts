import {useMemo} from 'react'

import {DEFAULT_CROP, DEFAULT_HOTSPOT, MARGIN_SIZE} from '../constants'
import {type Crop, type Hotspot} from '../types'
import {constrainHotspotToCrop, getCropDimensions} from '../utils'

interface UseRectCalculationsProps {
  size: {width: number; height: number}
  value: {crop?: Crop; hotspot?: Hotspot}
}

export function useRectCalculations({size, value}: UseRectCalculationsProps) {
  // Calculate dimensions and positions
  const imageRect = useMemo(
    () => ({left: 0, top: 0, width: size.width, height: size.height}),
    [size],
  )

  // Calculate inner rectangle while preserving original aspect ratio
  const innerRect = useMemo(() => {
    // Calculate available space after applying margins
    const availableWidth = imageRect.width - MARGIN_SIZE * 2
    const availableHeight = imageRect.height - MARGIN_SIZE * 2

    // Original aspect ratio
    const aspectRatio = imageRect.width / imageRect.height

    // Calculate dimensions that maintain aspect ratio
    let width
    let height
    if (availableWidth / availableHeight > aspectRatio) {
      // Height is limiting factor
      height = availableHeight
      width = height * aspectRatio
    } else {
      // Width is limiting factor
      width = availableWidth
      height = width / aspectRatio
    }

    // Center the inner rectangle
    const left = imageRect.left + (imageRect.width - width) / 2
    const top = imageRect.top + (imageRect.height - height) / 2

    return {left, top, width, height}
  }, [imageRect])

  // Calculate crop and hotspot rectangles
  const cropRect = useMemo(() => {
    const crop = value.crop || DEFAULT_CROP
    // Use getCropDimensions utility for consistent calculations
    const dimensions = getCropDimensions(crop)

    return {
      left: innerRect.left + innerRect.width * crop.left,
      top: innerRect.top + innerRect.height * crop.top,
      width: innerRect.width * dimensions.width,
      height: innerRect.height * dimensions.height,
    }
  }, [innerRect, value.crop])

  const constrainedHotspot = useMemo(() => {
    const hotspot = value.hotspot || DEFAULT_HOTSPOT
    const crop = value.crop || DEFAULT_CROP
    return constrainHotspotToCrop(hotspot, crop)
  }, [value.hotspot, value.crop])

  const hotspotRect = useMemo(() => {
    return {
      left:
        innerRect.left + innerRect.width * (constrainedHotspot.x - constrainedHotspot.width / 2),
      top:
        innerRect.top + innerRect.height * (constrainedHotspot.y - constrainedHotspot.height / 2),
      width: innerRect.width * constrainedHotspot.width,
      height: innerRect.height * constrainedHotspot.height,
    }
  }, [innerRect, constrainedHotspot])

  return {
    imageRect,
    innerRect,
    cropRect,
    constrainedHotspot,
    hotspotRect,
  }
}
