import {createVar, style} from '@vanilla-extract/css'

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

export const strokeColorVar = createVar()
export const handleStrokeColorVar = createVar()

export const cropRect = style({
  fill: 'none',
  stroke: strokeColorVar,
  strokeOpacity: 1,
  strokeWidth: '1px',
  outline: 'none',
})

export const cropRectFocused = style({
  strokeWidth: '2px',
  filter: 'drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.3))',
})

export const cropCornerHandle = style({
  fill: '#fff',
  stroke: handleStrokeColorVar,
  strokeWidth: 1,
  outline: 'none',
})

export const cropEdgeHandle = style({
  fill: '#fff',
  stroke: handleStrokeColorVar,
  strokeWidth: 1,
  outline: 'none',
})

export const hotspotEllipse = style({
  fill: 'transparent',
  stroke: strokeColorVar,
  strokeOpacity: 1,
  strokeWidth: '1px',
  outline: 'none',
})

export const hotspotEllipseFocused = style({
  strokeWidth: '2px',
})

export const hotspotHandle = style({
  fill: '#fff',
  stroke: handleStrokeColorVar,
  strokeWidth: 1,
  outline: 'none',
})

export const cropHandleInteractionArea = style({
  fill: 'transparent',
  stroke: 'transparent',
  pointerEvents: 'all',
})

export const hotspotHandleInteractionArea = style({
  fill: 'transparent',
  stroke: 'transparent',
  pointerEvents: 'all',
})

export const guidelinesStrokeVar = createVar()

export const guidelines = style({
  stroke: guidelinesStrokeVar,
  strokeOpacity: 0.2,
  strokeWidth: '1px',
  strokeDasharray: '3, 3',
  pointerEvents: 'none',
})

export const cropDimensionsBadgeGroupVisible = style({
  opacity: 1,
  transition: 'opacity 0.15s',
})

export const cropDimensionsBadgeGroupHidden = style({
  opacity: 0,
  transition: 'opacity 0.15s',
})

export const badgeFillVar = createVar()
export const badgeRadiusVar = createVar()

export const cropDimensionsBadgeRect = style({
  fill: badgeFillVar,
  rx: badgeRadiusVar,
})

export const badgeFontFamilyVar = createVar()
export const badgeFontSizeVar = createVar()
export const badgeLetterSpacingVar = createVar()
export const badgeFontWeightVar = createVar()

export const cropDimensionsBadgeText = style({
  fill: '#fff',
  fontFamily: badgeFontFamilyVar,
  fontSize: badgeFontSizeVar,
  letterSpacing: badgeLetterSpacingVar,
  fontWeight: badgeFontWeightVar,
  pointerEvents: 'none',
})
