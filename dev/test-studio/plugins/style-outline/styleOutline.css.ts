import {globalStyle, style} from '@vanilla-extract/css'

import {STYLE_OUTLINE_ATTRIBUTE, STYLE_SYSTEMS} from './styleSystems'

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

export const root = style({
  position: 'fixed',
  bottom: 12,
  left: 12,
  zIndex: 10000,
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.4,
  colorScheme: 'dark',
})

export const trigger = style([
  glass,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: 36,
    height: 36,
    padding: 0,
    borderRadius: '50%',
    cursor: 'pointer',
  },
])

export const panel = style([
  glass,
  {
    margin: 0,
    borderRadius: 12,
    padding: '12px 14px',
    minWidth: 260,
    color: '#ececf1',
  },
])

export const header = style({
  'display': 'block',
  'width': '100%',
  'font': 'inherit',
  'fontWeight': 600,
  'textAlign': 'left',
  'padding': '2px 0 8px',
  'border': 0,
  'background': 'transparent',
  'color': 'inherit',
  'cursor': 'pointer',
  ':hover': {
    color: '#ffffff',
  },
})

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '6px 0',
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

export const checkbox = style({
  width: 16,
  height: 16,
  margin: 0,
  cursor: 'pointer',
  accentColor: '#5e6ad2',
})
