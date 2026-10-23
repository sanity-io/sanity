import {css} from '#styled-system/css'

/** `rem(radius[1])` */
export const radius1Var = '--diff-string-radius-1'

export const roundedCard = css({
  // Rendered through `DiffCard as={RoundedCard}`, whose own `&&` rule sets border-radius on the
  // same element; `&&&` outranks it without depending on stylesheet order.
  '&&&': {
    borderRadius: `var(${radius1Var})`,
  },
})

export const changeSegment = css({
  // `&&` keeps the inline display independent of stylesheet order
  '&&:not([hidden])': {
    display: 'inline',
    lineHeight: 'calc(1.25em + 2px)',
  },
  '&:hover': {
    backgroundImage: `linear-gradient(
      to bottom,
      var(--card-bg-color) 0,
      var(--card-bg-color) 33.333%,
      currentColor 33.333%,
      currentColor 100%
    )`,
    backgroundSize: '1px 3px',
    backgroundRepeat: 'repeat-x',
    backgroundPositionY: 'bottom',
    paddingBottom: '3px',
    boxShadow: '0 0 0 1px var(--card-bg-color)',
    zIndex: 1,
  },
})
