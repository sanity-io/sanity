import {css} from '#styled-system/css'

/** `rem(radius[2])` */
export const diffCardRadiusVar = '--diff-card-radius'
/** Annotation background (`useAnnotationColor(...).background`) */
export const diffCardBgColorVar = '--diff-card-bg-color'
/** Annotation text color (`useAnnotationColor(...).text`) */
export const diffCardFgColorVar = '--diff-card-fg-color'

export const diffCard = css({
  'maxWidth': '100%',
  'position': 'relative',
  'zIndex': 1,
  // Card sets these declarations itself
  '&&': {
    borderRadius: `var(${diffCardRadiusVar})`,
    backgroundColor: `var(${diffCardBgColorVar})`,
    color: `var(${diffCardFgColorVar})`,
  },
  '&:not(del)': {
    textDecoration: 'none',
  },
  '&[data-hover]::after': {
    content: '""',
    display: 'block',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  '&[data-hover]:hover': {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  '[data-from-to-layout]:hover &': {
    '&[data-hover]': {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    '&[data-hover]::after': {
      bottom: '-3px',
      // Pre-existing typo (three dashes) carried over verbatim: the variable never resolves, so the
      // declaration is invalid at computed-value time and no top border renders.
      borderTop: '1px solid var(---diff-card-bg-color)',
      borderBottom: '2px solid currentColor',
      borderBottomLeftRadius: `var(${diffCardRadiusVar})`,
      borderBottomRightRadius: `var(${diffCardRadiusVar})`,
    },
  },
  '&[data-hover]:hover::after': {
    bottom: '-3px',
    // Pre-existing typo (three dashes) carried over verbatim: the variable never resolves, so the
    // declaration is invalid at computed-value time and no top border renders.
    borderTop: '1px solid var(---diff-card-bg-color)',
    borderBottom: '2px solid currentColor',
    borderBottomLeftRadius: `var(${diffCardRadiusVar})`,
    borderBottomRightRadius: `var(${diffCardRadiusVar})`,
  },
})
