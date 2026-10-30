import {css} from '#styled-system/css'

export const svgContainer = css({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  overflow: 'visible',
  touchAction: 'none',
  WebkitTouchCallout: 'none',
  WebkitTapHighlightColor: 'transparent',
  userSelect: 'none',
  WebkitUserSelect: 'none',
})

export const styledSVG = css({
  display: 'block',
  overflow: 'visible',
  shapeRendering: 'crispEdges',
})

export const darkenedOverlay = css({
  fill: 'rgba(0, 0, 0, 0.5)',
  pointerEvents: 'none',
})

// Crop and hotspot outlines: the stroke follows `$focused` (theme `color.focusRing`, published by
// the nearest Card as `--card-focus-ring-color`), then `$hovered`, then the resting color.

export const cropRect = css({
  fill: 'none',
  stroke: 'rgba(255, 255, 255, .5)',
  strokeOpacity: 1,
  strokeWidth: '1px',
  outline: 'none',
})

// The modifiers below follow their base class on the same element and win in that order (focused
// over hovered over resting), which the doubled and tripled class keeps.
export const cropRectHovered = css({
  '&&': {
    stroke: 'rgba(255, 255, 255, 1)',
  },
})

export const cropRectFocused = css({
  'filter': 'drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.3))',
  '&&&': {
    stroke: 'var(--card-focus-ring-color)',
    strokeWidth: '2px',
  },
})

export const hotspotEllipse = css({
  fill: 'transparent',
  stroke: 'rgba(255, 255, 255, .5)',
  strokeOpacity: 1,
  strokeWidth: '1px',
  outline: 'none',
})

export const hotspotEllipseHovered = css({
  '&&': {
    stroke: 'rgba(255, 255, 255, 1)',
  },
})

export const hotspotEllipseFocused = css({
  '&&&': {
    stroke: 'var(--card-focus-ring-color)',
    strokeWidth: '2px',
  },
})

// Crop corner/edge handles and the hotspot handle share the same rule set
export const handle = css({
  fill: '#fff',
  stroke: '#000',
  strokeWidth: 1,
  outline: 'none',
})

export const handleFocused = css({
  '&&': {
    stroke: 'var(--card-focus-ring-color)',
  },
})

// Enlarged, invisible hit areas around the handles
export const interactionArea = css({
  fill: 'transparent',
  stroke: 'transparent',
  pointerEvents: 'all',
})

export const guidelines = css({
  // theme `color.fg`
  stroke: 'var(--card-fg-color)',
  strokeOpacity: 0.2,
  strokeWidth: '1px',
  strokeDasharray: '3, 3',
  pointerEvents: 'none',
})

export const cropDimensionsBadgeGroup = css({
  transition: 'opacity 0.15s',
})

export const cropDimensionsBadgeGroupVisibility = {
  visible: css({
    opacity: 1,
  }),
  hidden: css({
    opacity: 0,
  }),
}

/** Theme `radius[1]` (px), set by the `CropDimensionsBadgeRect` wrapper */
export const radius1Var = '--tool-svg-radius-1'

export const cropDimensionsBadgeRect = css({
  // theme `color.focusRing`
  fill: 'var(--card-focus-ring-color)',
  rx: `var(${radius1Var})`,
})

/** Theme `font.text.family`, set by the `CropDimensionsBadgeText` wrapper */
export const fontTextFamilyVar = '--tool-svg-font-text-family'
/** Theme `font.text.sizes[0].fontSize` (px), set by the `CropDimensionsBadgeText` wrapper */
export const fontTextSize0FontSizeVar = '--tool-svg-font-text-size-0-font-size'
/** Theme `font.text.sizes[0].letterSpacing` (px), set by the `CropDimensionsBadgeText` wrapper */
export const fontTextSize0LetterSpacingVar = '--tool-svg-font-text-size-0-letter-spacing'
/** Theme `font.text.weights.medium`, set by the `CropDimensionsBadgeText` wrapper */
export const fontTextWeightMediumVar = '--tool-svg-font-text-weight-medium'

export const cropDimensionsBadgeText = css({
  fill: '#fff',
  fontFamily: `var(${fontTextFamilyVar})`,
  fontSize: `var(${fontTextSize0FontSizeVar})`,
  letterSpacing: `var(${fontTextSize0LetterSpacingVar})`,
  fontWeight: `var(${fontTextWeightMediumVar})`,
  pointerEvents: 'none',
})
