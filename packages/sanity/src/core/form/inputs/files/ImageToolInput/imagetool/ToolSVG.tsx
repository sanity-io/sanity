import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEventHandler,
} from 'react'

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
import {getCropStrokeColor, getHandleStrokeColor, getHotspotStrokeColor} from './styles.utils'
import {
  badgeFillColorVar,
  badgeFontFamilyVar,
  badgeFontSizeVar,
  badgeFontWeightVar,
  badgeLetterSpacingVar,
  cropCornerHandle,
  cropDimensionsBadgeGroup,
  cropDimensionsBadgeGroupVisible,
  cropDimensionsBadgeRect,
  cropDimensionsBadgeText,
  cropEdgeHandle,
  cropHandleInteractionArea,
  cropRect as cropRectClass,
  cursorVar,
  darkenedOverlay,
  filterVar,
  guidelines,
  guidelinesStrokeColorVar,
  handleStrokeColorVar,
  hotspotEllipse,
  hotspotHandle,
  hotspotHandleInteractionArea,
  styledSvg,
  strokeColorVar,
  strokeWidthVar,
  svgContainer,
  svgHeightVar,
  svgWidthVar,
} from './ToolSVG.css'
import {type ToolFocusTarget, type ToolSVGProps} from './types'
import {
  calculateCurrentCursor,
  getRectBottom,
  getRectCenterX,
  getRectCenterY,
  getRectRight,
} from './utils'

const BADGE_PADDING_X = 6
const BADGE_PADDING_Y = 3
const BADGE_OFFSET_Y = 8
const BADGE_CHAR_WIDTH_RATIO = 0.6

function CropDimensionsBadge(props: {
  x: number
  y: number
  width: number
  height: number
  visible: boolean
  onMouseEnter?: MouseEventHandler
  onMouseLeave?: MouseEventHandler
}) {
  const {x, y, width, height, visible, onMouseEnter, onMouseLeave} = props
  const {color, font, radius} = useThemeV2()
  const fontSize = font.text.sizes[1].fontSize
  const text = `${width} × ${height}`
  const textWidth = text.length * (fontSize * BADGE_CHAR_WIDTH_RATIO)
  const badgeWidth = textWidth + BADGE_PADDING_X * 2
  const badgeHeight = fontSize + BADGE_PADDING_Y * 2

  return (
    <g
      className={[cropDimensionsBadgeGroup, visible ? cropDimensionsBadgeGroupVisible : '']
        .filter(Boolean)
        .join(' ')}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <title>{`Cropped image size: ${width} × ${height} pixels`}</title>
      <rect
        className={cropDimensionsBadgeRect}
        x={x - badgeWidth / 2}
        y={y + BADGE_OFFSET_Y}
        width={badgeWidth}
        height={badgeHeight}
        rx={radius[1]}
        style={assignInlineVars({[badgeFillColorVar]: color.focusRing})}
      />
      <text
        className={cropDimensionsBadgeText}
        x={x}
        y={y + BADGE_OFFSET_Y + badgeHeight / 2}
        textAnchor="middle"
        dominantBaseline="central"
        style={assignInlineVars({
          [badgeFontFamilyVar]: font.text.family,
          [badgeFontSizeVar]: `${font.text.sizes[0].fontSize}px`,
          [badgeLetterSpacingVar]: `${font.text.sizes[0].letterSpacing}px`,
          [badgeFontWeightVar]: String(font.text.weights.medium),
        })}
      >
        {text}
      </text>
    </g>
  )
}

function ToolSVGComponent(props: ToolSVGProps) {
  const {value, image, onChange, onChangeEnd, readOnly, size} = props
  const svgRef = useRef<SVGSVGElement>(null)
  const cropRef = useRef<SVGRectElement>(null)
  const hotspotRef = useRef<SVGEllipseElement>(null)
  const [focusTarget, setFocusTarget] = useState<ToolFocusTarget | null>(null)

  const hotspotClipId = useMemo(() => `hotspotClip-${uuid()}`, [])

  useEffect(() => {
    const svgElement = svgRef.current
    if (!svgElement) return undefined

    const handleTouchMove = (e: TouchEvent) => {
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

  const croppedDimensions = useMemo(() => {
    const crop = value.crop || DEFAULT_CROP
    const croppedWidth = Math.round(image.naturalWidth * (1 - crop.left - crop.right))
    const croppedHeight = Math.round(image.naturalHeight * (1 - crop.top - crop.bottom))
    return {width: croppedWidth, height: croppedHeight}
  }, [image.naturalWidth, image.naturalHeight, value.crop])

  const cropHandles = useMemo(() => calculateCropHandles(cropRect), [cropRect])

  const hotspotHandlePosition = useMemo(
    () => ({
      ...getHotspotHandlePosition(hotspotRect),
      radius: HANDLE_VISUAL_SIZE_HOTSPOT / 2,
      hitRadius: HANDLE_INTERACTIVE_SIZE / 2,
    }),
    [hotspotRect],
  )

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

  const currentCursor = useMemo(
    () => calculateCurrentCursor(dragTarget, activeHandle, hoverTarget),
    [dragTarget, activeHandle, hoverTarget],
  )

  const {color} = useThemeV2()
  const focusRingColor = color.focusRing

  const hotspotIsActive =
    !readOnly &&
    (hoverTarget === 'hotspot' ||
      hoverTarget === 'hotspotHandle' ||
      dragTarget === 'hotspot' ||
      dragTarget === 'hotspotHandle')
  const cropIsActive =
    !readOnly &&
    (hoverTarget === 'crop' ||
      Boolean(hoverTarget?.startsWith('crop-')) ||
      dragTarget === 'crop' ||
      dragTarget === 'cropHandle')

  const hotspotFocused = !readOnly && focusTarget === 'hotspot'
  const cropFocused = !readOnly && focusTarget === 'crop'

  const hotspotStrokeColor = getHotspotStrokeColor({
    focused: hotspotFocused,
    hovered: hotspotIsActive,
    focusRingColor,
  })
  const cropStrokeColor = getCropStrokeColor({
    focused: cropFocused,
    hovered: cropIsActive,
    focusRingColor,
  })
  const handleStroke = getHandleStrokeColor({focused: !!focusTarget, focusRingColor})

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
    <div className={svgContainer}>
      <svg
        className={styledSvg}
        ref={svgRef}
        viewBox={`0 0 ${size.width} ${size.height}`}
        preserveAspectRatio="xMidYMid"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={assignInlineVars({
          [cursorVar]: readOnly ? 'default' : currentCursor,
          [svgWidthVar]: `${size.width}px`,
          [svgHeightVar]: `${size.height}px`,
        })}
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

          <rect
            className={darkenedOverlay}
            x="0"
            y="0"
            width={cropRect.width}
            height={cropRect.height}
          />

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

        <g>
          <ellipse
            className={hotspotEllipse}
            ref={hotspotRef}
            cx={getRectCenterX(hotspotRect)}
            cy={getRectCenterY(hotspotRect)}
            rx={Math.max(0.01, hotspotRect.width / 2)}
            ry={Math.max(0.01, hotspotRect.height / 2)}
            data-handle="hotspot"
            onPointerDown={handlePointerDown}
            tabIndex={readOnly ? -1 : 0}
            onMouseEnter={handleHotspotMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleHotspotFocus}
            onBlur={handleHotspotBlur}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            style={assignInlineVars({
              [strokeColorVar]: hotspotStrokeColor,
              [strokeWidthVar]: hotspotFocused ? '2px' : '1px',
            })}
          />

          {/* Hotspot handle - only show if not readOnly */}
          {!readOnly && (
            <g>
              {/* Invisible larger hit area for better touch interaction */}

              <circle
                className={hotspotHandleInteractionArea}
                cx={hotspotHandlePosition.x}
                cy={hotspotHandlePosition.y}
                r={hotspotHandlePosition.hitRadius}
                data-handle="hotspotHandle"
                onPointerDown={handlePointerDown}
                onMouseEnter={handleHotspotHandleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />

              {/* Visible handle */}
              <circle
                className={hotspotHandle}
                cx={hotspotHandlePosition.x}
                cy={hotspotHandlePosition.y}
                r={hotspotHandlePosition.radius}
                pointerEvents="none"
                style={assignInlineVars({
                  [handleStrokeColorVar]: handleStroke,
                })}
              />
            </g>
          )}
        </g>

        <g
          className={guidelines}
          style={assignInlineVars({
            [guidelinesStrokeColorVar]: color.fg,
          })}
        >
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
        </g>

        {/* Crop area */}
        <g>
          {/* Crop rectangle */}
          <rect
            className={cropRectClass}
            ref={cropRef}
            x={cropRect.left}
            y={cropRect.top}
            width={cropRect.width}
            height={cropRect.height}
            data-handle="crop"
            onPointerDown={handlePointerDown}
            tabIndex={readOnly ? -1 : 0}
            onMouseEnter={handleCropEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleCropFocus}
            onBlur={handleCropBlur}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            style={assignInlineVars({
              [strokeColorVar]: cropStrokeColor,
              [strokeWidthVar]: cropFocused ? '2px' : '1px',
              [filterVar]: cropFocused ? 'drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.3))' : 'none',
            })}
          />

          {/* Crop handles */}
          {!readOnly &&
            Object.entries(cropHandles).map(([key, handle]) => {
              const hovered = !readOnly && isHandleHovered(key)
              const cropHandleStroke = getHandleStrokeColor({
                focused: cropFocused || hovered,
                focusRingColor,
              })
              const cropHandleVars = assignInlineVars({[handleStrokeColorVar]: cropHandleStroke})

              return (
                <g key={key}>
                  {/* Interaction area */}
                  <rect
                    className={cropHandleInteractionArea}
                    x={handle.hit.left}
                    y={handle.hit.top}
                    width={handle.hit.width}
                    height={handle.hit.height}
                    data-handle={`crop-${key}`}
                    onPointerDown={handlePointerDown}
                    onMouseEnter={getCropHandleMouseEnter(key)}
                    onMouseLeave={handleMouseLeave}
                  />

                  {/* Either a corner or edge handle depending on the handle type */}
                  {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].includes(key) ? (
                    <g
                      transform={`translate(${handle.position?.x ?? 0}, ${handle.position?.y ?? 0}) rotate(${handle.rotation ?? 0})`}
                    >
                      <path
                        className={cropCornerHandle}
                        d={handle.path}
                        pointerEvents="none"
                        style={cropHandleVars}
                      />
                    </g>
                  ) : (
                    <rect
                      className={cropEdgeHandle}
                      x={handle.visual.left}
                      y={handle.visual.top}
                      width={handle.visual.width}
                      height={handle.visual.height}
                      pointerEvents="none"
                      style={cropHandleVars}
                    />
                  )}
                </g>
              )
            })}

          {/* Cropped resolution badge - visible on hover, drag, or focus */}
          <CropDimensionsBadge
            x={getRectCenterX(cropRect)}
            y={getRectBottom(cropRect)}
            width={croppedDimensions.width}
            height={croppedDimensions.height}
            onMouseEnter={handleCropMouseEnter}
            onMouseLeave={handleMouseLeave}
            visible={
              hoverTarget === 'crop' ||
              Boolean(hoverTarget?.startsWith('crop-')) ||
              dragTarget === 'crop' ||
              dragTarget === 'cropHandle' ||
              focusTarget === 'crop'
            }
          />
        </g>
      </svg>
    </div>
  )
}

export const ToolSVG = memo(ToolSVGComponent)
