import {css, firstThatWorks} from '#styled-system/css'

export const rootSpan = css({
  display: 'inline-flex',
  alignItems: 'center',
  verticalAlign: 'top',
  height: 'calc(1em - 1px)',
  maxWidth: '100%',
})

export const mediaSpanRadiusVar = '--inline-preview-media-span-radius'

export const mediaSpan = css({
  'position': 'relative',
  'display': 'inline-block',
  'width': 'calc(1em - 1px)',
  'height': 'calc(1em - 1px)',
  'minWidth': 'calc(1em - 1px)',
  '& img': {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: `var(${mediaSpanRadiusVar})`,
  },
  '& img + span': {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    boxShadow: 'inset 0 0 0 1px var(--card-fg-color)',
    opacity: 0.2,
    borderRadius: `var(${mediaSpanRadiusVar})`,
  },
  '& svg': {
    display: 'block',
    fontSize: 'calc(14 / 16 * 1em)',
    margin: '1px 0',
  },
  '& svg[data-sanity-icon]': {
    fontSize: 'calc(18 / 16 * 1em)',
    margin: 'calc(1px + (2 / 18 * -1em)) 0',
  },
})

export const textSpanFontSizeVar = '--inline-preview-text-span-font-size'
export const textSpanFontWeightVar = '--inline-preview-text-span-font-weight'
export const textSpanLineHeightVar = '--inline-preview-text-span-line-height'

export const textSpan = css({
  'boxSizing': 'border-box',
  'display': 'inline-block',
  'verticalAlign': 'top',
  'minWidth': 0,
  // Text sets font-size, font-weight, line-height and padding on itself
  '&&': {
    fontSize: `calc(var(${textSpanFontSizeVar}) / 16 * 1em)`,
    fontWeight: `var(${textSpanFontWeightVar})`,
    lineHeight: `var(${textSpanLineHeightVar})`,
    paddingLeft: '0.5em',
    paddingRight: 'calc(0.5em - 2px)',
  },
  '& > span': {
    display: 'block',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: firstThatWorks('clip', 'hidden'),
  },
})
