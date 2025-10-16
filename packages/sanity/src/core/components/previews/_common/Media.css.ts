import {globalStyle, style} from '@vanilla-extract/css'
import {vars} from '@sanity/ui/css'

import {PREVIEW_SIZES} from '../constants'

// Global styles for nested elements
globalStyle('[data-media-wrapper] img', {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  borderRadius: 'inherit',
})

globalStyle('[data-media-wrapper] svg', {
  color: vars.color.muted.fg,
  display: 'block',
  flex: 1,
})

globalStyle('[data-media-wrapper] svg:not([data-sanity-icon])', {
  height: '1em',
  width: '1em',
  maxWidth: '1em',
  maxHeight: '1em',
})

// Generate font size for Sanity icons based on layout
globalStyle('[data-media-wrapper][data-layout="compact"] svg[data-sanity-icon]', {
  display: 'block',
  fontSize: `calc(${PREVIEW_SIZES.compact.icon} / 16 * 1em)`,
})

globalStyle('[data-media-wrapper][data-layout="default"] svg[data-sanity-icon]', {
  display: 'block',
  fontSize: `calc(${PREVIEW_SIZES.default.icon} / 16 * 1em)`,
})

globalStyle('[data-media-wrapper][data-layout="detail"] svg[data-sanity-icon]', {
  display: 'block',
  fontSize: `calc(${PREVIEW_SIZES.detail.icon} / 16 * 1em)`,
})

globalStyle('[data-media-wrapper][data-layout="media"] svg[data-sanity-icon]', {
  display: 'block',
  fontSize: `calc(${PREVIEW_SIZES.media.icon} / 16 * 1em)`,
})

export const mediaWrapperBorderStyle = style({
  display: 'block',
  position: 'absolute',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  boxShadow: `inset 0 0 0 1px ${vars.color.fg}`,
  opacity: 0.1,
  borderRadius: 'inherit',
  pointerEvents: 'none',
})
