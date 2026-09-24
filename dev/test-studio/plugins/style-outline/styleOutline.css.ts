import {type ComplexStyleRule, globalStyle, style, styleVariants} from '@vanilla-extract/css'

import {type PanelCorner} from './corners'
import {STYLE_OUTLINE_ATTRIBUTE, STYLE_SYSTEMS} from './styleSystems'

// Overlapping nodes (eg a `styled(ui5Box)`) match several systems at once, and styled-components
// must win so the debt stays visible. Its exclusion `:not()` gives it the higher specificity today;
// keep it last in STYLE_SYSTEMS so it still wins on order should that exclusion ever go away.
for (const {id, color, selector} of STYLE_SYSTEMS) {
  globalStyle(`html[${STYLE_OUTLINE_ATTRIBUTE}~="${id}"] ${selector}`, {
    outline: `1px solid ${color} !important`,
    outlineOffset: '-1px',
  })
}

const glass = style({
  background: 'rgba(18, 18, 22, 0.92)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
})

const EDGE_GAP = 12

const cornerOffsets: Record<PanelCorner, ComplexStyleRule> = {
  'top-left': {top: EDGE_GAP, left: EDGE_GAP},
  'top-right': {top: EDGE_GAP, right: EDGE_GAP},
  'bottom-left': {bottom: EDGE_GAP, left: EDGE_GAP},
  'bottom-right': {bottom: EDGE_GAP, right: EDGE_GAP},
}

export const root = style({
  position: 'fixed',
  zIndex: 10000,
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.4,
  colorScheme: 'dark',
})

export const rootCorner = styleVariants(cornerOffsets)

export const rootDragging = style({
  userSelect: 'none',
  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)',
})

// Docked in a corner, but the panel is not part of the studio layout, so the drag
// affordance has to be the cursor plus the title on the handle.
const handle = style({
  cursor: 'grab',
  touchAction: 'none',
})

export const handleDragging = style({
  cursor: 'grabbing',
})

export const dropZoneLayer = style({
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  pointerEvents: 'none',
})

export const dropZone = style({
  position: 'absolute',
  width: 40,
  height: 40,
  borderRadius: 12,
  border: '1px dashed rgba(255, 255, 255, 0.35)',
  background: 'rgba(18, 18, 22, 0.35)',
})

export const dropZoneCorner = styleVariants(cornerOffsets)

export const dropZoneActive = style({
  borderStyle: 'solid',
  borderColor: '#5e6ad2',
  background: 'rgba(94, 106, 210, 0.35)',
})

export const trigger = style([
  glass,
  handle,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: 36,
    height: 36,
    padding: 0,
    borderRadius: '50%',
  },
])

export const panel = style([
  glass,
  {
    margin: 0,
    borderRadius: 12,
    padding: '12px 14px',
    width: 320,
    color: '#ececf1',
  },
])

export const header = style([
  handle,
  {
    'display': 'block',
    'width': '100%',
    'font': 'inherit',
    'fontWeight': 600,
    'textAlign': 'left',
    'padding': '2px 0 8px',
    'border': 0,
    'background': 'transparent',
    'color': 'inherit',
    ':hover': {
      color: '#ffffff',
    },
  },
])

export const group = style({
  padding: '4px 0',
})

export const groupHeading = style({
  margin: 0,
  padding: '2px 0 6px',
  fontSize: 11,
  fontWeight: 600,
  lineHeight: 1.4,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'rgba(236, 236, 241, 0.55)',
})

export const sectionDivider = style({
  height: 1,
  margin: '7px 0',
  background: 'rgba(255, 255, 255, 0.08)',
})

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 26,
  cursor: 'pointer',
})

export const dot = style({
  width: 8,
  height: 8,
  borderRadius: '50%',
  flexShrink: 0,
})

export const rowLabel = style({
  flex: 1,
})

export const rowCount = style({
  fontVariantNumeric: 'tabular-nums',
  fontSize: 12,
  color: 'rgba(236, 236, 241, 0.55)',
})

export const adoption = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
})

export const donut = style({
  position: 'relative',
  display: 'grid',
  width: 64,
  height: 64,
  borderRadius: '50%',
  flexShrink: 0,
  placeItems: 'center',
  selectors: {
    '&::after': {
      content: '',
      position: 'absolute',
      inset: 11,
      borderRadius: '50%',
      background: '#202024',
    },
  },
})

export const donutValue = style({
  position: 'relative',
  zIndex: 1,
  fontSize: 13,
  fontWeight: 650,
  fontVariantNumeric: 'tabular-nums',
})

export const legend = style({
  flex: 1,
})

export const escapeDetails = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
})

export const escapeCount = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 5,
})

export const escapeCountValue = style({
  fontSize: 18,
  fontWeight: 650,
  fontVariantNumeric: 'tabular-nums',
})

export const metricLabel = style({
  fontSize: 12,
  color: 'rgba(236, 236, 241, 0.72)',
})

export const cssMeter = style({
  height: 5,
  marginTop: 8,
  overflow: 'hidden',
  borderRadius: 999,
  background: 'rgba(255, 255, 255, 0.12)',
})

export const cssMeterFill = style({
  display: 'block',
  height: '100%',
  minWidth: 1,
  borderRadius: 'inherit',
  background: '#ff4fa3',
  transition: 'width 150ms ease-out',
})

export const checkbox = style({
  width: 16,
  height: 16,
  margin: 0,
  cursor: 'pointer',
  accentColor: '#5e6ad2',
})
