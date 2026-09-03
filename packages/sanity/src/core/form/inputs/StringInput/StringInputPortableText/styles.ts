import {type CardTone, rem} from '@sanity/ui'
import {type Theme_v2, type ThemeColorSchemeKey, type ThemeFontWeightKey} from '@sanity/ui/theme'
import {clsx} from 'clsx'

import {focusRingBorderStyle, focusRingStyle} from '../../../components/formField/styles'
import {
  inputDisabledBgVar,
  inputDisabledBorderShadowVar,
  inputDisabledFgVar,
  inputDisabledPlaceholderVar,
  inputEnabledBgVar,
  inputEnabledBorderShadowVar,
  inputEnabledFgVar,
  inputEnabledPlaceholderVar,
  inputFocusBorderShadowVar,
  inputFocusNoBorderShadowVar,
  inputHoveredBgVar,
  inputHoveredBorderShadowVar,
  inputHoveredFgVar,
  inputInvalidDisabledBgVar,
  inputInvalidDisabledBorderShadowVar,
  inputInvalidDisabledFgVar,
  inputInvalidEnabledBgVar,
  inputInvalidEnabledBorderShadowVar,
  inputInvalidEnabledFgVar,
  inputInvalidEnabledPlaceholderVar,
  inputInvalidHoveredBgVar,
  inputInvalidHoveredBorderShadowVar,
  inputInvalidHoveredFgVar,
  inputInvalidReadOnlyBgVar,
  inputInvalidReadOnlyFgVar,
  inputPaddingBottomVar,
  inputPaddingLeftVar,
  inputPaddingRightVar,
  inputPaddingTopVar,
  inputReadOnlyBgVar,
  inputReadOnlyFgVar,
  inputReadOnlyPlaceholderVar,
  responsiveInputPadding,
  textInputBase,
  textInputFontFamilyVar,
  textInputFontSize,
  textInputFontSizeVar,
  textInputFontWeightVar,
  textInputLineHeightVar,
  textInputRepresentation,
  textInputRepresentationFocusRing,
  textInputRepresentationHasPrefix,
  textInputRepresentationHasSuffix,
  textInputRoot,
} from './styles.css'

/**
 * A vanilla-extract class plus the inline custom properties that bridge theme values into it.
 * Wrappers merge `className` with `clsx` and pass `vars` to `assignInlineVars`.
 */
export interface TextInputStyle {
  className: string
  vars: Record<string, string>
}

const ROOT_STYLE: TextInputStyle = {className: textInputRoot, vars: {}}

/**
 * Heavily based on the styling provided by Sanity UI.
 */
export function textInputRootStyle(): TextInputStyle {
  return ROOT_STYLE
}

/**
 * Heavily based on the styling provided by Sanity UI.
 */
export function textInputBaseStyle(
  props: TextInputInputStyleProps,
  theme: Theme_v2,
): TextInputStyle {
  const {$weight} = props
  const {color, font} = theme

  return {
    className: textInputBase,
    vars: {
      [textInputFontFamilyVar]: font.text.family,
      [textInputFontWeightVar]: `${($weight && font.text.weights[$weight]) || font.text.weights.regular}`,
      [inputEnabledFgVar]: color.input.default.enabled.fg,
      [inputEnabledPlaceholderVar]: color.input.default.enabled.placeholder,
      [inputDisabledFgVar]: color.input.default.disabled.fg,
      [inputDisabledPlaceholderVar]: color.input.default.disabled.placeholder,
      [inputInvalidEnabledFgVar]: color.input.invalid.enabled.fg,
      [inputInvalidEnabledPlaceholderVar]: color.input.invalid.enabled.placeholder,
      [inputReadOnlyFgVar]: color.input.default.readOnly.fg,
      [inputReadOnlyPlaceholderVar]: color.input.default.readOnly.placeholder,
    },
  }
}

/**
 * Heavily based on the styling provided by Sanity UI.
 */
export interface TextInputRepresentationStyleProps {
  $hasPrefix?: boolean
  $hasSuffix?: boolean
  $scheme: ThemeColorSchemeKey
  $tone: CardTone
  $unstableDisableFocusRing?: boolean
}

/**
 * Heavily based on the styling provided by Sanity UI.
 */
export function textInputRepresentationStyle(
  props: TextInputRepresentationStyleProps,
  theme: Theme_v2,
): TextInputStyle {
  const {$hasPrefix, $hasSuffix, $unstableDisableFocusRing} = props
  const {color, input} = theme
  const width = input.border.width

  return {
    className: clsx(
      textInputRepresentation,
      $hasPrefix && textInputRepresentationHasPrefix,
      $hasSuffix && textInputRepresentationHasSuffix,
      !$unstableDisableFocusRing && textInputRepresentationFocusRing,
    ),
    vars: {
      [inputEnabledBgVar]: color.input.default.enabled.bg,
      [inputEnabledFgVar]: color.input.default.enabled.fg,
      /* enabled */
      [inputEnabledBorderShadowVar]: focusRingBorderStyle({
        color: color.input.default.enabled.border,
        width,
      }),
      /* invalid */
      [inputInvalidEnabledBgVar]: color.input.invalid.enabled.bg,
      [inputInvalidEnabledFgVar]: color.input.invalid.enabled.fg,
      [inputInvalidEnabledBorderShadowVar]: focusRingBorderStyle({
        color: color.input.invalid.enabled.border,
        width,
      }),
      /* focused */
      [inputFocusBorderShadowVar]: focusRingStyle({
        border: {color: color.input.default.enabled.border, width},
        focusRing: input.text.focusRing,
      }),
      [inputFocusNoBorderShadowVar]: focusRingStyle({focusRing: input.text.focusRing}),
      /* disabled */
      [inputDisabledBgVar]: color.input.default.disabled.bg,
      [inputDisabledFgVar]: color.input.default.disabled.fg,
      [inputDisabledBorderShadowVar]: focusRingBorderStyle({
        color: color.input.default.disabled.border,
        width,
      }),
      [inputInvalidDisabledBgVar]: color.input.invalid.disabled.bg,
      [inputInvalidDisabledFgVar]: color.input.invalid.disabled.fg,
      [inputInvalidDisabledBorderShadowVar]: focusRingBorderStyle({
        color: color.input.invalid.disabled.border,
        width,
      }),
      /* readOnly */
      [inputReadOnlyBgVar]: color.input.default.readOnly.bg,
      [inputReadOnlyFgVar]: color.input.default.readOnly.fg,
      [inputInvalidReadOnlyBgVar]: color.input.invalid.readOnly.bg,
      [inputInvalidReadOnlyFgVar]: color.input.invalid.readOnly.fg,
      /* hovered */
      [inputHoveredBgVar]: color.input.default.hovered.bg,
      [inputHoveredFgVar]: color.input.default.hovered.fg,
      [inputHoveredBorderShadowVar]: focusRingBorderStyle({
        color: color.input.default.hovered.border,
        width,
      }),
      [inputInvalidHoveredBgVar]: color.input.invalid.hovered.bg,
      [inputInvalidHoveredFgVar]: color.input.invalid.hovered.fg,
      [inputInvalidHoveredBorderShadowVar]: focusRingBorderStyle({
        color: color.input.invalid.hovered.border,
        width,
      }),
    },
  }
}

/**
 * Heavily based on the styling provided by Sanity UI.
 */
export interface TextInputResponsivePaddingStyleProps {
  $fontSize: number[]
  $iconLeft?: boolean
  $iconRight?: boolean
  $padding: number[]
  $space: number[]
}

/**
 * Heavily based on the styling provided by Sanity UI.
 *
 * Media queries cannot read custom properties, so only the first (base breakpoint) entry of each
 * responsive array is applied. `StringInputPortableText` passes single-entry arrays, for which the
 * original `_responsive()` expansion collapsed to the same base rule.
 */
export function responsiveInputPaddingStyle(
  props: TextInputResponsivePaddingStyleProps,
  theme: Theme_v2,
): TextInputStyle {
  const {$fontSize, $iconLeft, $iconRight, $padding, $space} = props
  const {font, space} = theme

  const size = font.text.sizes[$fontSize[0]] || font.text.sizes[2]
  const emSize = size.lineHeight - size.ascenderHeight - size.descenderHeight
  const p = space[$padding[0]]
  const s = space[$space[0]]

  return {
    className: responsiveInputPadding,
    vars: {
      [inputPaddingTopVar]: `${rem(p - size.ascenderHeight)}`,
      [inputPaddingRightVar]: `${rem($iconRight ? p + emSize + s : p)}`,
      [inputPaddingBottomVar]: `${rem(p - size.descenderHeight)}`,
      [inputPaddingLeftVar]: `${rem($iconLeft ? p + emSize + s : p)}`,
    },
  }
}

/**
 * Heavily based on the styling provided by Sanity UI.
 */
export interface TextInputInputStyleProps {
  $fontSize: number[]
  $scheme: ThemeColorSchemeKey
  $tone: CardTone
  $weight?: ThemeFontWeightKey
}

/**
 * Heavily based on the styling provided by Sanity UI.
 *
 * Only the first (base breakpoint) `$fontSize` entry is applied; see `responsiveInputPaddingStyle`.
 */
export function textInputFontSizeStyle(
  props: TextInputInputStyleProps,
  theme: Theme_v2,
): TextInputStyle {
  const {font} = theme
  const size = font.text.sizes[props.$fontSize[0]] || font.text.sizes[2]

  return {
    className: textInputFontSize,
    vars: {
      [textInputFontSizeVar]: `${rem(size.fontSize)}`,
      [textInputLineHeightVar]: `${size.lineHeight / size.fontSize}`,
    },
  }
}
