import {css} from '#styled-system/css'

/** The custom property `FormFieldGutter` sets inline to the anchor name of its field's input. */
export const formFieldAnchorPath = '--form-field-anchor-path'

export const formFieldAnchor = css({
  '@supports (position-anchor: --anchor)': {
    position: 'absolute',
    positionAnchor: `var(${formFieldAnchorPath})`,
    insetBlockStart: 'anchor(center)',
    transform: 'translateY(-50%)',
    lineHeight: 0,
  },
})
