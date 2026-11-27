import {css} from '#styled-system/css'

/**
 * The banner's action as a link at the end of its sentence, used while the document inventory is
 * open, where the inventory's own Create variant button is the view's filled one. A real button,
 * in the sentence's colour and underlined, with the focus ring the studio's controls use.
 */
export const inlineAction = css({
  'display': 'inline',
  'padding': 0,
  'margin': 0,
  'border': 0,
  'background': 'none',
  'font': 'inherit',
  'color': 'var(--card-fg-color)',
  'textAlign': 'start',
  'textDecoration': 'underline',
  'textUnderlineOffset': '0.15em',
  'cursor': 'pointer',
  'borderRadius': '2px',
  '&:hover': {
    textDecorationThickness: '2px',
  },
  '&:focus': {
    outline: 'none',
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: '0 0 0 1px var(--card-bg-color), 0 0 0 3px var(--card-focus-ring-color)',
  },
})
