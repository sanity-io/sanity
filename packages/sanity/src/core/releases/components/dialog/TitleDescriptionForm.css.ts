import {css} from '#styled-system/css'

// Theme bridge (`font.text.*` and `color.input.default.enabled.*` are not published as `--card-*`
// variables). The title and description assign different weights/sizes to the same variables.
export const fontTextFamilyVar = '--title-description-form-font-text-family'
export const fontTextWeightVar = '--title-description-form-font-text-weight'
export const fontTextSizeVar = '--title-description-form-font-text-size'
export const fontTextLineHeightVar = '--title-description-form-font-text-line-height'
export const inputFgColorVar = '--title-description-form-input-fg-color'
export const inputPlaceholderColorVar = '--title-description-form-input-placeholder-color'

const textAreaRaw = css.raw({
  'resize': 'none',
  'overflow': 'hidden',
  'appearance': 'none',
  'background': 'none',
  'border': 0,
  'padding': 0,
  'borderRadius': 0,
  'outline': 'none',
  'width': '100%',
  'boxSizing': 'border-box',
  'fontFamily': `var(${fontTextFamilyVar})`,
  'fontWeight': `var(${fontTextWeightVar})`,
  'fontSize': `var(${fontTextSizeVar})`,
  'lineHeight': `var(${fontTextLineHeightVar})`,
  'margin': 0,
  'position': 'relative',
  'zIndex': 1,
  'display': 'block',
  'color': `var(${inputFgColorVar})`,
  '&::placeholder': {
    color: `var(${inputPlaceholderColorVar})`,
  },
})

const textArea = css(textAreaRaw)

export const titleTextArea = css(textAreaRaw, {
  'minHeight': `var(${fontTextLineHeightVar})`,
  /* NOTE: This is a hack to disable Chrome's autofill styles */
  '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active':
    {
      WebkitTextFillColor: `var(${inputFgColorVar})`,
      transition: 'background-color 5000s',
      transitionDelay: '86400s',
      /* 24h */
    },
})

export const descriptionTextArea = css(textAreaRaw, {
  height: 'auto',
  maxWidth: '624px',
})
