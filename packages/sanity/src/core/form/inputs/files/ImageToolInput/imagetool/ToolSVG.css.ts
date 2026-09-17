import {createVar, style, styleVariants} from '@vanilla-extract/css'

export const svgContainer = style({
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

export const styledSVG = style({
  display: 'block',
  overflow: 'visible',
  shapeRendering: 'crispEdges',
})

export const darkenedOverlay = style({
  fill: 'rgba(0, 0, 0, 0.5)',
  pointerEvents: 'none',
})

// Crop and hotspot outlines: the stroke follows `$focused` (theme `color.focusRing`, published by
// the nearest Card as `--card-focus-ring-color`), then `$hovered`, then the resting color.

export const cropRect = style({
  fill: 'none',
  stroke: 'rgba(255, 255, 255, .5)',
  strokeOpacity: 1,
  strokeWidth: '1px',
  outline: 'none',
})

export const cropRectHovered = style({
  stroke: 'rgba(255, 255, 255, 1)',
})

export const cropRectFocused = style({
  stroke: 'var(--card-focus-ring-color)',
  strokeWidth: '2px',
  filter: 'drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.3))',
})

export const hotspotEllipse = style({
  fill: 'transparent',
  stroke: 'rgba(255, 255, 255, .5)',
  strokeOpacity: 1,
  strokeWidth: '1px',
  outline: 'none',
})

export const hotspotEllipseHovered = style({
  stroke: 'rgba(255, 255, 255, 1)',
})

export const hotspotEllipseFocused = style({
  stroke: 'var(--card-focus-ring-color)',
  strokeWidth: '2px',
})

// Crop corner/edge handles and the hotspot handle share the same rule set
export const handle = style({
  fill: '#fff',
  stroke: '#000',
  strokeWidth: 1,
  outline: 'none',
})

export const handleFocused = style({
  stroke: 'var(--card-focus-ring-color)',
})

// Enlarged, invisible hit areas around the handles
export const interactionArea = style({
  fill: 'transparent',
  stroke: 'transparent',
  pointerEvents: 'all',
})

export const guidelines = style({
  // theme `color.fg`
  stroke: 'var(--card-fg-color)',
  strokeOpacity: 0.2,
  strokeWidth: '1px',
  strokeDasharray: '3, 3',
  pointerEvents: 'none',
})

export const cropDimensionsBadgeGroup = style({
  transition: 'opacity 0.15s',
})

export const cropDimensionsBadgeGroupVisibility = styleVariants({
  visible: {opacity: 1},
  hidden: {opacity: 0},
})

/** Theme `radius[1]` (px), set by the `CropDimensionsBadgeRect` wrapper */
export const radius1Var = createVar()

export const cropDimensionsBadgeRect = style({
  // theme `color.focusRing`
  fill: 'var(--card-focus-ring-color)',
  rx: radius1Var,
})

/** Theme `font.text.family`, set by the `CropDimensionsBadgeText` wrapper */
export const fontTextFamilyVar = createVar()
/** Theme `font.text.sizes[0].fontSize` (px), set by the `CropDimensionsBadgeText` wrapper */
export const fontTextSize0FontSizeVar = createVar()
/** Theme `font.text.sizes[0].letterSpacing` (px), set by the `CropDimensionsBadgeText` wrapper */
export const fontTextSize0LetterSpacingVar = createVar()
/** Theme `font.text.weights.medium`, set by the `CropDimensionsBadgeText` wrapper */
export const fontTextWeightMediumVar = createVar()

export const cropDimensionsBadgeText = style({
  fill: '#fff',
  fontFamily: fontTextFamilyVar,
  fontSize: fontTextSize0FontSizeVar,
  letterSpacing: fontTextSize0LetterSpacingVar,
  fontWeight: fontTextWeightMediumVar,
  pointerEvents: 'none',
})
