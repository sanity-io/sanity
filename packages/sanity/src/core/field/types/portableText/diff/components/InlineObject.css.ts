import {css} from '#styled-system/css'

export const inlineObjectWrapper = css({
  // `&&`: Card's own `&:not([hidden]) {display: block}` is (0,2,0).
  '&&:not([hidden])': {
    display: 'inline',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    alignItems: 'center',
  },
  '&:not([hidden])[data-removed]': {
    textDecoration: 'line-through',
  },
})

/**
 * The `InlineBox` of an inline object. `inlineBox` sets its own display from `&&:not([hidden])`
 * (0,3,0); the tripled class keeps this override above it regardless of stylesheet order.
 */
export const inlineObjectInlineBox = css({
  '&&&:not([hidden])': {
    display: 'inline-flex',
  },
})
