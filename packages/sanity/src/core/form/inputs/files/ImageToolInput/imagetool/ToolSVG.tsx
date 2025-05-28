import {uuid} from '@sanity/uuid'
import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {
  DEFAULT_CROP,
  DEFAULT_HOTSPOT,
  HANDLE_INTERACTIVE_SIZE,
  HANDLE_VISUAL_SIZE_HOTSPOT,
} from './constants'
import {calculateCropHandles, getHotspotHandlePosition} from './Handles'
import {useHoverHandlers} from './hooks/useHoverHandlers'
import {useKeyboardControls} from './hooks/useKeyboardControls'
import {usePointerHandlers} from './hooks/usePointerHandlers'
import {useRectCalculations} from './hooks/useRectCalculations'
import {
  CropCornerHandle,
  CropEdgeHandle,
  CropHandleInteractionArea,
  CropRect,
  DarkenedOverlay,
  Guidelines,
  HotspotEllipse,
  HotspotHandle,
  HotspotHandleInteractionArea,
  StyledSVG,
  SVGContainer,
} from './ToolSVG.styles'
import {type ToolFocusTarget, type ToolSVGProps} from './types'
import {
  calculateCurrentCursor,
  getRectBottom,
  getRectCenterX,
  getRectCenterY,
  getRectRight,
} from './utils'

function ToolSVGComponent(props: ToolSVGProps) {
  const {value, image, onChange, onChangeEnd, readOnly, size} = props
  const svgRef = useRef<SVGSVGElement>(null)
  const cropRef = useRef<SVGRectElement>(null)
  const hotspotRef = useRef<SVGEllipseElement>(null)
  const [focusTarget, setFocusTarget] = useState<ToolFocusTarget | null>(null)

  // Generate a unique ID for the clipPath
  const hotspotClipId = useMemo(() => `hotspotClip-${uuid()}`, [])

  useEffect(() => {
    const svgElement = svgRef.current
    if (!svgElement) return undefined

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent iOS scrolling page while dragging the element
      e.preventDefault()
      return undefined
    }

    svgElement.addEventListener('touchmove', handleTouchMove, {passive: false})

    return () => {
      svgElement.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  const {innerRect, cropRect, constrainedHotspot, hotspotRect} = useRectCalculations({
    size,
    value,
  })

  const {
    hoverTarget,
    handleMouseEnter,
    handleMouseLeave,
    handleHotspotMouseEnter,
    handleHotspotHandleMouseEnter,
    handleCropMouseEnter,
    getCropHandleMouseEnter,
  } = useHoverHandlers()

  const {dragTarget, activeHandle, handlePointerDown, handlePointerMove, resetDragState} =
    usePointerHandlers({
      value,
      onChange,
      innerRect,
      svgRef,
      size,
      readOnly,
      hotspotRef,
      cropRef,
    })

  const {handleKeyDown, handleKeyUp} = useKeyboardControls({
    value,
    onChange,
    onChangeEnd,
    innerRect,
    focusTarget,
    readOnly,
  })

  const cropHandles = useMemo(() => calculateCropHandles(cropRect), [cropRect])

  const hotspotHandlePosition = useMemo(
    () => ({
      ...getHotspotHandlePosition(hotspotRect),
      radius: HANDLE_VISUAL_SIZE_HOTSPOT / 2,
      hitRadius: HANDLE_INTERACTIVE_SIZE / 2,
    }),
    [hotspotRect],
  )

  // Handle focus events
  const handleFocus = useCallback((target: ToolFocusTarget | null) => {
    setFocusTarget(target)
  }, [])

  const handleBlur = useCallback(() => {
    setFocusTarget(null)
  }, [])

  const handleHotspotFocus = useCallback(() => handleFocus('hotspot'), [handleFocus])
  const handleHotspotBlur = useCallback(() => handleBlur(), [handleBlur])
  const handleCropFocus = useCallback(() => handleFocus('crop'), [handleFocus])
  const handleCropBlur = useCallback(() => handleBlur(), [handleBlur])

  // Other event handlers
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const svg = svgRef.current
      if (!svg) return

      if (dragTarget) {
        if (dragTarget === 'hotspot' || dragTarget === 'hotspotHandle') {
          onChangeEnd({
            hotspot: constrainedHotspot,
            crop: value.crop || DEFAULT_CROP,
          })
        } else if (dragTarget === 'crop' || dragTarget === 'cropHandle') {
          onChangeEnd({
            crop: value.crop || DEFAULT_CROP,
            hotspot: value.hotspot || DEFAULT_HOTSPOT,
          })
        }
      }

      svg.releasePointerCapture(e.pointerId)
      resetDragState()
    },
    [dragTarget, onChangeEnd, value.crop, value.hotspot, constrainedHotspot, resetDragState],
  )

  // Get current cursor based on hover and drag states
  const currentCursor = useMemo(
    () => calculateCurrentCursor(dragTarget, activeHandle, hoverTarget),
    [dragTarget, activeHandle, hoverTarget],
  )

  const handleCropEnter = useCallback(() => handleMouseEnter('crop'), [handleMouseEnter])

  // Helper to check if a hover target is a crop handle or matches a specific handle
  const isHandleHovered = useCallback(
    (handleId: string): boolean => {
      if (!hoverTarget) return false
      if (hoverTarget === 'crop') return true
      return hoverTarget === `crop-${handleId}`
    },
    [hoverTarget],
  )

  return (
    <SVGContainer>
      <StyledSVG
        ref={svgRef}
        viewBox={`0 0 ${size.width} ${size.height}`}
        preserveAspectRatio="xMidYMid"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          cursor: readOnly ? 'default' : currentCursor,
          width: `${size.width}px`,
          height: `${size.height}px`,
        }}
      >
        {/* Background image with reduced opacity */}
        <image
          href={image.src}
          x={innerRect.left}
          y={innerRect.top}
          width={innerRect.width}
          height={innerRect.height}
          opacity={0.25}
          preserveAspectRatio="xMidYMid meet"
        />

        {/* Crop area with medium opacity image */}
        <svg
          x={cropRect.left}
          y={cropRect.top}
          width={cropRect.width}
          height={cropRect.height}
          overflow="hidden"
          data-handle="crop"
          onPointerDown={handlePointerDown}
          onMouseEnter={handleCropMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <image
            href={image.src}
            x={-cropRect.left + innerRect.left}
            y={-cropRect.top + innerRect.top}
            width={innerRect.width}
            height={innerRect.height}
            preserveAspectRatio="xMidYMid meet"
          />

          {/* Darkened overlay for crop area */}
          <DarkenedOverlay x="0" y="0" width={cropRect.width} height={cropRect.height} />

          {/* Transparent overlay to make the entire crop area draggable */}
          <rect
            x="0"
            y="0"
            width={cropRect.width}
            height={cropRect.height}
            fill="transparent"
            data-handle="crop"
            onPointerDown={handlePointerDown}
            onMouseEnter={handleCropMouseEnter}
          />
        </svg>

        {/* Hotspot area with full opacity - masked with ellipse */}
        <defs>
          <clipPath id={hotspotClipId}>
            <ellipse
              cx={getRectCenterX(hotspotRect)}
              cy={getRectCenterY(hotspotRect)}
              rx={hotspotRect.width / 2}
              ry={hotspotRect.height / 2}
            />
          </clipPath>
        </defs>

        <image
          href={image.src}
          x={innerRect.left}
          y={innerRect.top}
          width={innerRect.width}
          height={innerRect.height}
          clipPath={`url(#${hotspotClipId})`}
          preserveAspectRatio="xMidYMid meet"
        />

        {/* Hotspot */}
        <g>
          {/* Hotspot ellipse - make it interactive for dragging but allow crop handles to take precedence */}
          <HotspotEllipse
            ref={hotspotRef}
            cx={getRectCenterX(hotspotRect)}
            cy={getRectCenterY(hotspotRect)}
            rx={Math.max(0.01, hotspotRect.width / 2)}
            ry={Math.max(0.01, hotspotRect.height / 2)}
            $hovered={
              !readOnly &&
              (hoverTarget === 'hotspot' ||
                hoverTarget === 'hotspotHandle' ||
                dragTarget === 'hotspot' ||
                dragTarget === 'hotspotHandle')
            }
            $focused={!readOnly && focusTarget === 'hotspot'}
            data-handle="hotspot"
            onPointerDown={handlePointerDown}
            tabIndex={readOnly ? -1 : 0}
            onMouseEnter={handleHotspotMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleHotspotFocus}
            onBlur={handleHotspotBlur}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            style={{pointerEvents: 'visiblePainted'}}
          />

          {/* Hotspot handle - only show if not readOnly */}
          {!readOnly && (
            <g>
              {/* Invisible larger hit area for better touch interaction */}
              <HotspotHandleInteractionArea
                cx={hotspotHandlePosition.x}
                cy={hotspotHandlePosition.y}
                r={hotspotHandlePosition.hitRadius}
                data-handle="hotspotHandle"
                onPointerDown={handlePointerDown}
                onMouseEnter={handleHotspotHandleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{pointerEvents: 'visiblePainted'}}
              />

              {/* Visible handle */}
              <HotspotHandle
                cx={hotspotHandlePosition.x}
                cy={hotspotHandlePosition.y}
                r={hotspotHandlePosition.radius}
                $hovered={
                  !readOnly &&
                  (hoverTarget === 'hotspot' ||
                    hoverTarget === 'hotspotHandle' ||
                    dragTarget === 'hotspot' ||
                    dragTarget === 'hotspotHandle')
                }
                $focused={!readOnly && focusTarget === 'hotspot'}
                pointerEvents="none"
              />
            </g>
          )}
        </g>

        {/* Guidelines */}
        <Guidelines>
          {/* Vertical center line */}
          <line
            x1={getRectCenterX(hotspotRect)}
            y1={innerRect.top}
            x2={getRectCenterX(hotspotRect)}
            y2={getRectBottom(innerRect)}
          />
          {/* Horizontal center line */}
          <line
            x1={innerRect.left}
            y1={getRectCenterY(hotspotRect)}
            x2={getRectRight(innerRect)}
            y2={getRectCenterY(hotspotRect)}
          />
          {/* Left edge line */}
          <line
            x1={hotspotRect.left}
            y1={innerRect.top}
            x2={hotspotRect.left}
            y2={getRectBottom(innerRect)}
          />
          {/* Right edge line */}
          <line
            x1={getRectRight(hotspotRect)}
            y1={innerRect.top}
            x2={getRectRight(hotspotRect)}
            y2={getRectBottom(innerRect)}
          />
          {/* Top edge line */}
          <line
            x1={innerRect.left}
            y1={hotspotRect.top}
            x2={getRectRight(innerRect)}
            y2={hotspotRect.top}
          />
          {/* Bottom edge line */}
          <line
            x1={innerRect.left}
            y1={getRectBottom(hotspotRect)}
            x2={getRectRight(innerRect)}
            y2={getRectBottom(hotspotRect)}
          />
        </Guidelines>

        {/* Crop area */}
        <g>
          {/* Crop rectangle */}
          <CropRect
            ref={cropRef}
            x={cropRect.left}
            y={cropRect.top}
            width={cropRect.width}
            height={cropRect.height}
            $hovered={
              !readOnly &&
              (hoverTarget === 'crop' ||
                Boolean(hoverTarget?.startsWith('crop-')) ||
                dragTarget === 'crop' ||
                dragTarget === 'cropHandle')
            }
            $focused={!readOnly && focusTarget === 'crop'}
            data-handle="crop"
            onPointerDown={handlePointerDown}
            tabIndex={readOnly ? -1 : 0}
            onMouseEnter={handleCropEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleCropFocus}
            onBlur={handleCropBlur}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
          />

          {/* Crop handles */}
          {!readOnly &&
            Object.entries(cropHandles).map(([key, handle]) => {
              return (
                <g key={key}>
                  {/* Interaction area */}
                  <CropHandleInteractionArea
                    x={handle.hit.left}
                    y={handle.hit.top}
                    width={handle.hit.width}
                    height={handle.hit.height}
                    data-handle={`crop-${key}`}
                    onPointerDown={handlePointerDown}
                    onMouseEnter={getCropHandleMouseEnter(key)}
                    onMouseLeave={handleMouseLeave}
                    style={{pointerEvents: 'all'}}
                  />

                  {/* Either a corner or edge handle depending on the handle type */}
                  {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].includes(key) ? (
                    <g
                      transform={`translate(${handle.position?.x ?? 0}, ${handle.position?.y ?? 0}) rotate(${handle.rotation ?? 0})`}
                    >
                      <CropCornerHandle
                        d={handle.path}
                        $hovered={!readOnly && isHandleHovered(key)}
                        $focused={!readOnly && focusTarget === 'crop'}
                        pointerEvents="none"
                      />
                    </g>
                  ) : (
                    <CropEdgeHandle
                      x={handle.visual.left}
                      y={handle.visual.top}
                      width={handle.visual.width}
                      height={handle.visual.height}
                      $hovered={!readOnly && isHandleHovered(key)}
                      $focused={!readOnly && focusTarget === 'crop'}
                      pointerEvents="none"
                    />
                  )}
                </g>
              )
            })}
        </g>
      </StyledSVG>
    </SVGContainer>
  )
}

export const ToolSVG = memo(ToolSVGComponent)
