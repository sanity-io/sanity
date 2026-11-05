import {css} from '#styled-system/css'

export const radius2Var = '--filter-button-radius-2'

export const closeButton = css({
  // Override the border-radius @sanity/ui's Button sets from its `radius` prop
  '&&': {
    borderRadius: `0 var(${radius2Var}) var(${radius2Var}) 0`,
  },
})

export const closeCard = css({
  position: 'absolute',
  right: 0,
})

export const containerDiv = css({
  alignItems: 'center',
  display: 'inline-flex',
  maxWidth: '100%',
  position: 'relative',
})

export const labelButton = css({
  // Override declarations that @sanity/ui's Button sets on itself
  '&&': {
    border: 'none',
    width: '100%',
  },
})
