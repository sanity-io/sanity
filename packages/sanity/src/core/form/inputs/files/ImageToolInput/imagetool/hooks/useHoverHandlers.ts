import {useCallback, useState} from 'react'

import {type ToolHandleType, type ToolInteractionTarget} from '../types'

export function useHoverHandlers() {
  const [hoverTarget, setHoverTarget] = useState<ToolInteractionTarget | ToolHandleType | null>(
    null,
  )

  // Handle mouse enter/leave for hover states
  const handleMouseEnter = useCallback((target: ToolInteractionTarget | ToolHandleType) => {
    setHoverTarget(target)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoverTarget(null)
  }, [])

  // Add handlers for hotspot elements
  const handleHotspotMouseEnter = useCallback(() => handleMouseEnter('hotspot'), [handleMouseEnter])

  const handleHotspotHandleMouseEnter = useCallback(
    () => handleMouseEnter('hotspotHandle'),
    [handleMouseEnter],
  )

  const handleCropMouseEnter = useCallback(() => handleMouseEnter('crop'), [handleMouseEnter])

  // For dynamic crop handles
  const getCropHandleMouseEnter = useCallback(
    (key: string) => {
      return () => handleMouseEnter(`crop-${key}` as ToolHandleType)
    },
    [handleMouseEnter],
  )

  return {
    hoverTarget,
    handleMouseEnter,
    handleMouseLeave,
    handleHotspotMouseEnter,
    handleHotspotHandleMouseEnter,
    handleCropMouseEnter,
    getCropHandleMouseEnter,
  }
}
