import {css} from '#styled-system/css'

/** Theme `space[4]`; set inline by the elements that compose the rule below. */
export const gutterSpace4Var = '--form-gutter-space-4'
/** Theme `space[3]`; set inline by the elements that compose the rule below. */
export const gutterSpace3Var = '--form-gutter-space-3'

/**
 * Declares the custom properties that control the form gutter.
 *
 * @internal
 */
export const formGutterCustomProperties = css.raw({
  '--formGutterSize': '0px',
  '--formGutterGap': '0px',
  "&[data-gutter='true']": {
    '--formGutterSize': `var(${gutterSpace4Var})`,
    '--formGutterGap': `var(${gutterSpace3Var})`,
  },
})
