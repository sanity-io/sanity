import {css} from '#styled-system/css'

/** `color.solid.critical.enabled.bg` (v2: `color.button.default.critical.enabled.bg`) */
export const revertChangesFgColorVar = '--revert-changes-button-revert-changes-fg-color'

export const revertChangesButton = css({
  // `&&`: Button's own hovered/pressed rules set the same `--card-*` variables from
  // `.btn:not([data-disabled='true']):hover` (0,3,0); the extra class keeps this override winning
  // regardless of stylesheet order.
  "&&:not([data-disabled='true']):hover, &&:not([data-disabled='true']):focus": {
    '--card-fg-color': `var(${revertChangesFgColorVar})`,
    '--card-bg-color': 'transparent',
    '--card-border-color': 'transparent',
  },
  "&& [data-ui='Text']": {
    fontWeight: 'normal',
  },
  "& div[data-ui='Box']": {
    display: 'none',
  },
  "&:not([data-disabled='true']):hover div[data-ui='Box'], &:not([data-disabled='true']):focus div[data-ui='Box']":
    {
      display: 'block',
    },
})
