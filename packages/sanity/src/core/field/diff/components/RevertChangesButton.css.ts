import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `color.solid.critical.enabled.bg` (v2: `color.button.default.critical.enabled.bg`) */
export const revertChangesFgColorVar = createVar()

export const revertChangesButton = style({
  selectors: {
    // `&&`: Button's own hovered/pressed rules set the same `--card-*` variables from
    // `.btn:not([data-disabled='true']):hover` (0,3,0); the extra class keeps this override winning
    // regardless of stylesheet order.
    "&&:not([data-disabled='true']):hover, &&:not([data-disabled='true']):focus": {
      vars: {
        '--card-fg-color': revertChangesFgColorVar,
        '--card-bg-color': 'transparent',
        '--card-border-color': 'transparent',
      },
    },
  },
})

globalStyle(`${revertChangesButton} [data-ui='Text']`, {
  fontWeight: 'normal',
})

globalStyle(`${revertChangesButton} div[data-ui='Box']`, {
  display: 'none',
})

globalStyle(
  `${revertChangesButton}:not([data-disabled='true']):hover div[data-ui='Box'], ${revertChangesButton}:not([data-disabled='true']):focus div[data-ui='Box']`,
  {
    display: 'block',
  },
)
