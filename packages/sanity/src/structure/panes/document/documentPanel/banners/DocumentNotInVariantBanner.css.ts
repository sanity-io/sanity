import {css} from '#styled-system/css'

/**
 * The banner's sentences for each state of its create action (the filled button, the link into the
 * open document inventory, the pointer to its open form), stacked in one cell. Only the current one
 * is visible; the others keep their space, so the banner is as tall as its longest sentence in every
 * state and nothing below it moves as the inventory opens and closes.
 */
export const sentenceStack = css({
  display: 'grid',
})

export const sentence = css({
  gridArea: '1 / 1',
})

export const hiddenSentence = css({
  gridArea: '1 / 1',
  visibility: 'hidden',
})

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
