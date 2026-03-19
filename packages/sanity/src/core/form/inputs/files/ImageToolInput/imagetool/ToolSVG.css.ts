import {createVar, style} from '@vanilla-extract/css'

export const cursorVar = createVar()
export const svgWidthVar = createVar()
export const svgHeightVar = createVar()
export const strokeColorVar = createVar()
export const strokeWidthVar = createVar()
export const filterVar = createVar()
export const handleStrokeColorVar = createVar()
export const guidelinesStrokeColorVar = createVar()
export const badgeFillColorVar = createVar()
export const badgeFontFamilyVar = createVar()
export const badgeFontSizeVar = createVar()
export const badgeLetterSpacingVar = createVar()
export const badgeFontWeightVar = createVar()

export const svgContainer = style({
  selectors: {
    '&&': {
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
    },
  },
})

export const styledSvg = style({
  selectors: {
    '&&': {
      display: 'block',
      overflow: 'visible',
      shapeRendering: 'crispEdges',
      cursor: cursorVar,
      width: svgWidthVar,
      height: svgHeightVar,
    },
  },
})

export const darkenedOverlay = style({
  selectors: {
    '&&': {
      fill: 'rgba(0, 0, 0, 0.5)',
      pointerEvents: 'none',
    },
  },
})

export const cropRect = style({
  selectors: {
    '&&': {
      fill: 'none',
      strokeOpacity: 1,
      outline: 'none',
      stroke: strokeColorVar,
      strokeWidth: strokeWidthVar,
      filter: filterVar,
    },
  },
})

export const cropCornerHandle = style({
  selectors: {
    '&&': {
      fill: '#fff',
      strokeWidth: 1,
      outline: 'none',
      stroke: handleStrokeColorVar,
    },
  },
})

export const cropEdgeHandle = style({
  selectors: {
    '&&': {
      fill: '#fff',
      strokeWidth: 1,
      outline: 'none',
      stroke: handleStrokeColorVar,
    },
  },
})

export const hotspotEllipse = style({
  selectors: {
    '&&': {
      fill: 'transparent',
      strokeOpacity: 1,
      outline: 'none',
      pointerEvents: 'visiblePainted',
      stroke: strokeColorVar,
      strokeWidth: strokeWidthVar,
    },
  },
})

export const hotspotHandle = style({
  selectors: {
    '&&': {
      fill: '#fff',
      strokeWidth: 1,
      outline: 'none',
      stroke: handleStrokeColorVar,
    },
  },
})

export const cropHandleInteractionArea = style({
  selectors: {
    '&&': {
      fill: 'transparent',
      stroke: 'transparent',
      pointerEvents: 'all',
    },
  },
})

export const hotspotHandleInteractionArea = style({
  selectors: {
    '&&': {
      fill: 'transparent',
      stroke: 'transparent',
      pointerEvents: 'visiblePainted',
    },
  },
})

export const guidelines = style({
  selectors: {
    '&&': {
      strokeOpacity: 0.2,
      strokeWidth: '1px',
      strokeDasharray: '3, 3',
      pointerEvents: 'none',
      stroke: guidelinesStrokeColorVar,
    },
  },
})

export const cropDimensionsBadgeGroup = style({
  selectors: {
    '&&': {
      opacity: 0,
      transition: 'opacity 0.15s',
    },
  },
})

export const cropDimensionsBadgeGroupVisible = style({
  selectors: {
    '&&': {
      opacity: 1,
    },
  },
})

export const cropDimensionsBadgeRect = style({
  fill: badgeFillColorVar,
})

export const cropDimensionsBadgeText = style({
  selectors: {
    '&&': {
      fill: '#fff',
      pointerEvents: 'none',
      fontFamily: badgeFontFamilyVar,
      fontSize: badgeFontSizeVar,
      letterSpacing: badgeLetterSpacingVar,
      fontWeight: badgeFontWeightVar,
    },
  },
})
