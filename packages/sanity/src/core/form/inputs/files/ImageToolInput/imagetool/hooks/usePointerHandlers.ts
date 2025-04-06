import {type RefObject, useCallback, useRef, useState} from 'react'

import {DEFAULT_CROP, DEFAULT_HOTSPOT} from '../constants'
import {
  type Crop,
  type CropAndHotspot,
  type Hotspot,
  type Rect,
  type ToolHandleType,
  type ToolInteractionTarget,
} from '../types'
import {
  getPointerPosition,
  handleCropHandleResize,
  handleCropMove,
  handleHotspotMove,
  handleHotspotResize,
} from '../utils'

interface UsePointerHandlersProps {
  value: Partial<CropAndHotspot>
  onChange: (value: CropAndHotspot) => void
  innerRect: Rect
  svgRef: RefObject<SVGSVGElement | null>
  size: {width: number; height: number}
  readOnly: boolean
  hotspotRef: RefObject<SVGEllipseElement | null>
  cropRef: RefObject<SVGRectElement | null>
}

export function usePointerHandlers({
  value,
  onChange,
  innerRect,
  svgRef,
  size,
  readOnly,
  hotspotRef,
  cropRef,
}: UsePointerHandlersProps) {
  // Internal refs for tracking drag state
  const initialCropRef = useRef<Crop | null>(null)
  const initialCursorRef = useRef<{x: number; y: number} | null>(null)
  const initialHotspotRef = useRef<Hotspot | null>(null)

  const [dragStart, setDragStart] = useState<{x: number; y: number} | null>(null)
  const [dragTarget, setDragTarget] = useState<ToolInteractionTarget | null>(null)
  const [activeHandle, setActiveHandle] = useState<ToolHandleType | null>(null)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGElement>) => {
      if (readOnly) return

      const svg = svgRef.current
      if (!svg) return

      const rect = svg.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * size.width
      const y = ((e.clientY - rect.top) / rect.height) * size.height

      setDragStart({x, y})
      initialCursorRef.current = {x, y}
      initialCropRef.current = {...(value.crop || DEFAULT_CROP)}
      initialHotspotRef.current = {...(value.hotspot || DEFAULT_HOTSPOT)}

      const element = e.currentTarget as SVGElement
      const handle = element.dataset.handle

      if (handle === 'hotspotHandle') {
        setDragTarget('hotspotHandle')
        hotspotRef.current?.focus()
      } else if (handle === 'hotspot') {
        setDragTarget('hotspot')
        hotspotRef.current?.focus()
      } else if (handle && handle.startsWith('crop-')) {
        setActiveHandle(handle as ToolHandleType)
        setDragTarget('cropHandle')
        cropRef.current?.focus()
      } else if (handle === 'crop') {
        setDragTarget('crop')
        cropRef.current?.focus()
      }

      svg.setPointerCapture(e.pointerId)

      e.preventDefault()
      e.stopPropagation()
    },
    [readOnly, size.width, size.height, value.crop, value.hotspot, svgRef, hotspotRef, cropRef],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const svg = svgRef.current
      if (
        !svg ||
        !dragTarget ||
        !dragStart ||
        !initialCursorRef.current ||
        !initialCropRef.current ||
        !initialHotspotRef.current
      )
        return

      const pointerPos = getPointerPosition(e, svg, size)

      if (dragTarget === 'hotspot') {
        const result = handleHotspotMove(
          {
            crop: value.crop || DEFAULT_CROP,
            hotspot: initialHotspotRef.current,
          },
          initialCursorRef.current,
          pointerPos,
          innerRect,
        )
        onChange(result)
      } else if (dragTarget === 'hotspotHandle') {
        const result = handleHotspotResize({
          initialHotspot: initialHotspotRef.current,
          crop: value.crop || DEFAULT_CROP,
          initialCursor: initialCursorRef.current,
          pointerPos,
          innerRect,
        })
        onChange(result)
      } else if (dragTarget === 'crop') {
        const params = {
          initialCrop: initialCropRef.current,
          initialHotspot: initialHotspotRef.current,
          initialCursor: initialCursorRef.current,
          pointerPos,
          innerRect,
        }
        const result = handleCropMove(params)
        onChange(result)
      } else if (dragTarget === 'cropHandle' && activeHandle) {
        const result = handleCropHandleResize({
          initialCrop: initialCropRef.current,
          initialHotspot: initialHotspotRef.current,
          initialCursor: initialCursorRef.current,
          pointerPos,
          innerRect,
          activeHandle,
        })
        onChange(result)
      }
    },
    [
      dragStart,
      dragTarget,
      activeHandle,
      innerRect,
      onChange,
      value.crop,
      size,
      svgRef,
      initialHotspotRef,
      initialCropRef,
      initialCursorRef,
    ],
  )

  const resetDragState = useCallback(() => {
    setDragTarget(null)
    setActiveHandle(null)
    setDragStart(null)

    initialCropRef.current = null
    initialCursorRef.current = null
    initialHotspotRef.current = null
  }, [])

  return {
    dragTarget,
    activeHandle,
    dragStart,
    handlePointerDown,
    handlePointerMove,
    resetDragState,
  }
}
