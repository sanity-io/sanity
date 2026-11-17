import {css} from '#styled-system/css'

export const styledMenu = css({
  width: '308px',
  borderRadius: '3px',
})

export const mentionUserMenuItemText = css({
  '[data-ui="MenuItem"]:not([data-disabled])[data-selected] &': {
    '--text-color': 'light-dark(var(--white), var(--black))',
  },
})
