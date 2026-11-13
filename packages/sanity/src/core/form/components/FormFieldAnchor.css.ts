import {css} from '#styled-system/css'

/** The custom property `FormFieldGutter` sets inline to the anchor name of its field's input. */
export const formFieldAnchorPath = '--form-field-anchor-path'

/**
 * The custom property `FormFieldGutter` sets inline to the anchor name of its field's title row
 * (or of the input, when the field has no title).
 */
export const formFieldLabelAnchorPath = '--form-field-label-anchor-path'

export const formFieldAnchor = css({
  '@supports (position-anchor: --anchor)': {
    'position': 'absolute',
    'positionAnchor': `var(${formFieldAnchorPath})`,
    'insetBlockStart': 'anchor(center)',
    'transform': 'translateY(-50%)',
    'lineHeight': 0,
    // The gutter shows only its first child (`formFieldGutter`), so the anchor follows that child,
    // not a prop: the base variant mark lines up with the title row while it is the one shown,
    // including while it fades out, and a divergence indicator shown in its place stays on the
    // input. A prop would move the gutter the moment the field matched its base again, and the
    // fading mark would jump from the title to the middle of the value before it disappeared.
    // `data-gutter-label-anchored` marks such a child; the property is `formFieldLabelAnchorPath`,
    // spelled out so Panda can extract the rule.
    '&:has(> [data-gutter-label-anchored]:first-child)': {
      positionAnchor: 'var(--form-field-label-anchor-path)',
    },
  },
})
