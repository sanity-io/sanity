import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const editableWrap = style({
  selectors: {
    '&&': {
      maxHeight: '20vh',
      overflowY: 'auto',
    },
  },
})

export const buttonDivider = style({
  selectors: {
    '&&': {
      height: '20px',
      width: '1px',
    },
  },
})

export const inputBoxShadowVar = createVar()
export const focusedBoxShadowVar = createVar()
export const hoveredBoxShadowVar = createVar()
export const radiiVar = createVar()

export const rootCard = style({
  selectors: {
    '&&': {
      borderRadius: radiiVar,
      boxShadow: inputBoxShadowVar,
    },
    '&&:not([data-expand-on-focus="false"], :focus-within)': {
      background: 'transparent',
      boxShadow: 'unset',
    },
  },
})

globalStyle(`${rootCard}[data-focused="true"]:focus-within ${editableWrap}`, {
  minHeight: '1em',
})

globalStyle(`${rootCard}[data-focused="true"]:focus-within`, {
  boxShadow: focusedBoxShadowVar,
})

globalStyle(`${rootCard}:focus-within ${editableWrap}`, {
  minHeight: '1em',
})

globalStyle(`${rootCard}[data-expand-on-focus="false"] ${editableWrap}`, {
  minHeight: '1em',
})

globalStyle(`${rootCard}[data-expand-on-focus="true"] [data-ui="CommentInputActions"]:not([hidden])`, {
  display: 'none',
})

globalStyle(`${rootCard}[data-expand-on-focus="true"]:focus-within [data-ui="CommentInputActions"]`, {
  display: 'flex',
})

globalStyle(`${rootCard}:hover`, {
  boxShadow: hoveredBoxShadowVar,
})

export const avatarMinHeightVar = createVar()

export const avatarContainer = style({
  minHeight: avatarMinHeightVar,
  display: 'flex',
  alignItems: 'center',
})
