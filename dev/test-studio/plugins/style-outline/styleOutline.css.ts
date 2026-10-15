import {css} from '#styled-system/css'

// The debug outlines each style system paints over its nodes are global rules, generated from
// STYLE_SYSTEMS in ../../panda.config.ts (`globalCss`).

const glass = css.raw({
  background: 'rgba(18, 18, 22, 0.92)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
})

// The corner it is docked in lives in a transform written by Motion (see
// `corners.ts`), so the widget itself only ever sits at the viewport origin.
export const root = css({
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 10000,
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.4,
  colorScheme: 'dark',
})

export const rootDragging = css({
  userSelect: 'none',
})

// Worn by whichever element starts a drag: the panel header when open, the trigger
// when collapsed. `touch-action: none` so a touch drag moves the widget instead of
// scrolling the studio behind it, and no text selection to swallow a quick drag.
const handle = css.raw({
  cursor: 'grab',
  touchAction: 'none',
  userSelect: 'none',
})

export const trigger = css(glass, handle, {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  width: 36,
  height: 36,
  padding: 0,
  borderRadius: '50%',
})

export const panel = css(glass, {
  margin: 0,
  borderRadius: 12,
  padding: '12px 14px',
  width: 320,
  color: '#ececf1',
})

export const header = css(handle, {
  'display': 'block',
  'width': '100%',
  'font': 'inherit',
  'fontWeight': 600,
  'textAlign': 'left',
  'padding': '2px 0 8px',
  'border': 0,
  'background': 'transparent',
  'color': 'inherit',
  '&:hover': {
    color: '#ffffff',
  },
})

// Panda emits one rule per declaration, ordered by where a declaration is first seen, so these
// overrides come after the elements that wear `glass` and `handle`: their `box-shadow` and
// `cursor` rules then follow the ones they replace while a drag is live.

// Worn by the panel or the trigger rather than by the wrapper around them, so the
// shadow of a widget being carried keeps the shape it belongs to — the panel's
// rounded corners, the collapsed trigger's circle.
export const lifted = css({
  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)',
})

export const handleDragging = css({
  cursor: 'grabbing',
})

export const group = css({
  padding: '4px 0',
})

export const groupHeading = css({
  margin: 0,
  padding: '2px 0 6px',
  fontSize: 11,
  fontWeight: 600,
  lineHeight: 1.4,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'rgba(236, 236, 241, 0.55)',
})

export const sectionDivider = css({
  height: 1,
  margin: '7px 0',
  background: 'rgba(255, 255, 255, 0.08)',
})

export const row = css({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 26,
  cursor: 'pointer',
})

export const dot = css({
  width: 8,
  height: 8,
  borderRadius: '50%',
  flexShrink: 0,
})

export const rowLabel = css({
  flex: 1,
})

export const rowCount = css({
  fontVariantNumeric: 'tabular-nums',
  fontSize: 12,
  color: 'rgba(236, 236, 241, 0.55)',
})

export const adoption = css({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
})

export const donut = css({
  'position': 'relative',
  'display': 'grid',
  'width': 64,
  'height': 64,
  'borderRadius': '50%',
  'flexShrink': 0,
  'placeItems': 'center',

  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 11,
    borderRadius: '50%',
    background: '#202024',
  },
})

export const donutValue = css({
  position: 'relative',
  zIndex: 1,
  fontSize: 13,
  fontWeight: 650,
  fontVariantNumeric: 'tabular-nums',
})

export const legend = css({
  flex: 1,
})

export const escapeDetails = css({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
})

export const escapeCount = css({
  display: 'flex',
  alignItems: 'baseline',
  gap: 5,
})

export const escapeCountValue = css({
  fontSize: 18,
  fontWeight: 650,
  fontVariantNumeric: 'tabular-nums',
})

export const metricLabel = css({
  fontSize: 12,
  color: 'rgba(236, 236, 241, 0.72)',
})

export const cssMeter = css({
  height: 5,
  marginTop: 8,
  overflow: 'hidden',
  borderRadius: 999,
  background: 'rgba(255, 255, 255, 0.12)',
})

export const cssMeterFill = css({
  display: 'block',
  height: '100%',
  minWidth: 1,
  borderRadius: 'inherit',
  background: '#ff4fa3',
  transition: 'width 150ms ease-out',
})

export const checkbox = css({
  width: 16,
  height: 16,
  margin: 0,
  cursor: 'pointer',
  accentColor: '#5e6ad2',
})
