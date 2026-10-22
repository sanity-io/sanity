import {css} from '#styled-system/css'

/** `color.button.ghost.neutral.enabled.fg` */
export const ghostNeutralFgVar = '--text-button-ghost-neutral-fg'

export const textButton = css({
  'all': 'unset',
  'display': 'inline-block',
  'maxInlineSize': '100%',
  'whiteSpace': 'nowrap',
  'appearance': 'none',
  'border': 0,
  'margin': 0,
  'padding': 0,
  'outline': 'none',
  'color': `var(${ghostNeutralFgVar})`,
  // @sanity/ui's Text sets `color` on itself with a single class (0,1,0), the same specificity
  // `.textButton *` has; the original only won that tie by styled-components injection order.
  '&& *': {
    color: 'inherit',
  },
  '& svg[data-sanity-icon]': {
    color: 'currentColor',
  },
})
