import {css, firstThatWorks} from '#styled-system/css'

export const mediaWidthVar = '--media-width'
export const mediaHeightVar = '--media-height'
export const mediaRadiusVar = '--media-radius'
export const mediaIconSizeVar = '--media-icon-size'

export const mediaWrapper = css({
  'position': 'relative',
  'borderRadius': `var(${mediaRadiusVar})`,
  'display': 'flex',
  'overflow': firstThatWorks('clip', 'hidden'),
  'alignItems': 'center',
  'justifyContent': 'center',
  '& img': {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    borderRadius: 'inherit',
  },
  // Shared styles for SVG icons
  '& svg': {
    color: 'var(--card-icon-color)',
    display: 'block',
    flex: 1,
  },
  // Specific styles for non Sanity icons
  '& svg:not([data-sanity-icon])': {
    height: '1em',
    width: '1em',
    maxWidth: '1em',
    maxHeight: '1em',
  },
  // Specific styles for Sanity icons
  '& svg[data-sanity-icon]': {
    display: 'block',
    fontSize: `calc(var(${mediaIconSizeVar}) / 16 * 1em)`,
  },
  '& > span[data-border]': {
    display: 'block',
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    boxShadow: 'inset 0 0 0 1px var(--card-fg-color)',
    opacity: 0.1,
    borderRadius: 'inherit',
    pointerEvents: 'none',
  },
})

export const mediaWrapperResponsive = css({
  width: '100%',
  height: '100%',
})

export const mediaWrapperFixed = css({
  width: `var(${mediaWidthVar})`,
  height: `var(${mediaHeightVar})`,
  minWidth: `var(${mediaWidthVar})`,
})
