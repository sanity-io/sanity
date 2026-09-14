import {createVar, style} from '@vanilla-extract/css'

/** `rem(radius[2])` */
export const diffCardRadiusVar = createVar()
/** Annotation background (`useAnnotationColor(...).background`) */
export const diffCardBgColorVar = createVar()
/** Annotation text color (`useAnnotationColor(...).text`) */
export const diffCardFgColorVar = createVar()

export const diffCard = style({
  maxWidth: '100%',
  position: 'relative',
  borderRadius: diffCardRadiusVar,
  backgroundColor: diffCardBgColorVar,
  color: diffCardFgColorVar,
  zIndex: 1,
  selectors: {
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
    '&[data-hover]:hover, [data-from-to-layout]:hover &[data-hover]': {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    '&[data-hover]:hover::after, [data-from-to-layout]:hover &[data-hover]::after': {
      bottom: '-3px',
      // Pre-existing typo (three dashes) carried over verbatim: the variable never resolves, so the
      // declaration is invalid at computed-value time and no top border renders.
      borderTop: '1px solid var(---diff-card-bg-color)',
      borderBottom: '2px solid currentColor',
      borderBottomLeftRadius: diffCardRadiusVar,
      borderBottomRightRadius: diffCardRadiusVar,
    },
  },
})
