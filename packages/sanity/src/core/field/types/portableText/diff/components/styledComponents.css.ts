import {css} from '#styled-system/css'

export const inlineBox = css({
  // `&&`: ui5 Box's own display utility (`.sui-display-block:not([hidden])`) is (0,2,0).
  '&&:not([hidden])': {
    display: 'inline',
    alignItems: 'center',
  },
  '&:not([hidden])[data-changed]': {
    cursor: 'pointer',
  },
  // `data-diff-preview-container` is rendered by `PreviewContainer`
  '[data-diff-preview-container]:not([hidden]) &': {
    '& [data-ui="Text"], & [data-ui="Icon"]': {
      opacity: 0.5,
    },
  },
})

export const previewContainer = css({
  // `&&`: ui5 Box's own display utility (`.sui-display-block:not([hidden])`) is (0,2,0).
  '&&:not([hidden])': {
    display: 'inline-flex',
    alignItems: 'center',
  },
})

export const popoverContainer = css({
  'maxHeight': '40vh',
  'overflowY': 'auto',
  // `&&`: ui5 Box sets `min-width` on itself by default (`.sui-min-width`, (0,1,0)).
  '&&': {
    minWidth: '160px',
  },
})
