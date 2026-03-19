import {createVar, style} from '@vanilla-extract/css'

export const borderRadiusVar = createVar()
export const boxShadowVar = createVar()
export const focusBoxShadowVar = createVar()
export const disabledColorVar = createVar()
export const disabledBgVar = createVar()
export const disabledBoxShadowVar = createVar()
export const spaceVar = createVar()

export const rootStyle = style({
  position: 'relative',
  borderRadius: borderRadiusVar,
  boxShadow: boxShadowVar,
  selectors: {
    '&&:not([data-read-only])': {
      cursor: 'text',
    },
    '&&:not([data-disabled]):not([data-read-only])[data-focused]': {
      boxShadow: focusBoxShadowVar,
    },
  },
})

export const inputFontSizeVar = createVar()
export const inputLineHeightVar = createVar()
export const inputFontFamilyVar = createVar()
export const inputFontWeightVar = createVar()
export const inputPaddingTopVar = createVar()
export const inputPaddingRightVar = createVar()
export const inputPaddingBottomVar = createVar()
export const inputPaddingLeftVar = createVar()
export const inputColorVar = createVar()
export const inputDisabledColorVar = createVar()

export const inputStyle = style({
  appearance: 'none',
  background: 'none',
  border: 0,
  borderRadius: 0,
  outline: 'none',
  fontSize: inputFontSizeVar,
  lineHeight: inputLineHeightVar,
  fontFamily: inputFontFamilyVar,
  fontWeight: inputFontWeightVar,
  margin: '0',
  display: 'block',
  minWidth: '1px',
  maxWidth: '100%',
  boxSizing: 'border-box',
  paddingTop: inputPaddingTopVar,
  paddingRight: inputPaddingRightVar,
  paddingBottom: inputPaddingBottomVar,
  paddingLeft: inputPaddingLeftVar,
  selectors: {
    '&:not(:invalid):not(:disabled)': {
      color: inputColorVar,
    },
    '&:not(:invalid):disabled': {
      color: inputDisabledColorVar,
    },
  },
})

export const placeholderColorVar = createVar()

export const placeholderStyle = style({
  selectors: {
    '&&': {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      pointerEvents: 'none',
      vars: {
        '--card-fg-color': placeholderColorVar,
      },
    },
  },
})

export const contentStyle = style({
  position: 'relative',
  lineHeight: '0',
  margin: `calc(${spaceVar} * -1) 0 0 calc(${spaceVar} * -1)`,
})

export const contentItemStyle = style({
  display: 'inline-block',
  verticalAlign: 'top',
  padding: `${spaceVar} 0 0 ${spaceVar}`,
})

export const tagBox = style({
  selectors: {
    '&&': {
      // This is needed to make textOverflow="ellipsis" work properly for the Text primitive
      maxWidth: '100%',
    },
  },
})
