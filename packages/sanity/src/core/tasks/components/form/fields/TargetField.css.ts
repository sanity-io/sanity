import {css} from '#styled-system/css'

/** `color.input.default.hovered.border` */
export const inputHoveredBorderColorVar = '--target-field-input-hovered-border-color'
/** `color.input.default.enabled.placeholder` */
export const inputPlaceholderColorVar = '--target-field-input-placeholder-color'

export const emptyReferenceRoot = css({
  // Card's `border` prop sets `border` with `&&` (0,2,0); the styled() wrapper's (0,2,0)
  // pseudo-class rules only won by injection order, so match them with a second class.
  '&&:focus': {
    border: '1px solid var(--card-focus-ring-color)',
  },
  '&&:focus-visible': {
    outline: 'none',
    border: '1px solid var(--card-focus-ring-color)',
  },
  // `&&&`: the hover border color wins over the focus borders above, which it followed
  '&&&:hover': {
    borderColor: `var(${inputHoveredBorderColorVar})`,
  },
})

export const placeholder = css({
  'marginLeft': '3px',
  // Text sets `color` on itself
  '&&': {
    color: `var(${inputPlaceholderColorVar})`,
  },
})

// This allows to hide and show the remove button on hover or focus.
export const targetRoot = css({
  'position': 'relative',
  '&:focus-within, &:hover': {
    paddingRight: '36px',
  },
  /* Hides the preview status dot; the button will take its position. */
  "&:focus-within [data-testid='compact-preview__status'], &:hover [data-testid='compact-preview__status']":
    {
      opacity: 0,
    },
})

// `data-task-target-field` is rendered by the element with the `targetRoot` class
export const showOnHover = css({
  'opacity': 0,
  'position': 'absolute',
  'right': '6px',
  'top': '4px',
  'display': 'flex',
  '[data-task-target-field]:focus-within &, [data-task-target-field]:hover &': {
    transition: 'opacity 200ms',
    opacity: 1,
  },
})

// Rendered as `<Card as={CardLink} data-as="button">`, so Card's `&[data-as='button']` rules
// (0,2,0) share this element: `width: stretch` and `cursor: default` beat the single-class
// `width`/`cursor` below, exactly as they did before the migration. The focus box-shadow tied
// with Card's `box-shadow: var(--card-focus-ring-box-shadow)` and won by order, hence `&&`.
export const styledIntentLink = css({
  'textDecoration': 'none',
  'width': '100%',
  'overflow': 'hidden',
  'cursor': 'pointer',
  '&&:focus': {
    boxShadow: '0 0 0 1px var(--card-focus-ring-color)',
  },
  '&&:focus-visible': {
    outline: 'none',
    boxShadow: '0 0 0 1px var(--card-focus-ring-color)',
  },
})
