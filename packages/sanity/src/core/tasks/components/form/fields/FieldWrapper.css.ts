import {css} from '#styled-system/css'

/** `font.text.weights.regular` */
export const fontTextWeightRegularVar = '--field-wrapper-font-text-weight-regular'

export const fieldWrapperRoot = css({
  // Reset the padding of the field header content box
  "& [data-ui='fieldHeaderContentBox']": {
    padding: 0,
  },
  "& [data-ui='fieldHeaderContentBox'] label": {
    fontWeight: `var(${fontTextWeightRegularVar})`,
  },
})
