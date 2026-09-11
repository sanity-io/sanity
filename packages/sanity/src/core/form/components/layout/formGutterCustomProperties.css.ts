import {createVar, type StyleRule} from '@vanilla-extract/css'

/** Theme `space[4]`; set with `assignInlineVars` by the elements that compose the rule below. */
export const gutterSpace4Var = createVar()
/** Theme `space[3]`; set with `assignInlineVars` by the elements that compose the rule below. */
export const gutterSpace3Var = createVar()

/**
 * Declares the custom properties that control the form gutter.
 *
 * @internal
 */
export const formGutterCustomProperties: StyleRule = {
  vars: {
    '--formGutterSize': '0px',
    '--formGutterGap': '0px',
  },
  selectors: {
    "&[data-gutter='true']": {
      vars: {
        '--formGutterSize': gutterSpace4Var,
        '--formGutterGap': gutterSpace3Var,
      },
    },
  },
}
