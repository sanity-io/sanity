import {css} from '#styled-system/css'

const stickyCardRaw = css.raw({
  'position': 'sticky',
  'zIndex': 2,
  '&&': {
    background: 'var(--card-bg-color)',
  },
})

// Card sets `background-color` on its own class; the doubled class wins that tie by specificity
// the way the runtime-injected wrapper used to by insertion order.
const stickyCard = css(stickyCardRaw)

export const stickyTopCard = css(stickyCardRaw, {
  top: 0,
})

export const stickyBottomCard = css(stickyCardRaw, {
  bottom: 0,
})
