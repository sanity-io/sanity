import {style} from '@vanilla-extract/css'

export const styledMenu = style({
  width: '308px',
  borderRadius: '3px',
})

export const mentionUserMenuItemText = style({
  selectors: {
    '[data-ui="MenuItem"]:not([data-disabled])[data-selected] &': {
      vars: {
        '--text-color': 'light-dark(var(--white), var(--black))',
      },
    },
  },
})
