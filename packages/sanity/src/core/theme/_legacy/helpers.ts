import {parseColor, rgbToHex, screen, multiply} from '@sanity/ui/theme'
import {getLuminance, mix, parseToRgb, rgb} from 'polished'
import {LegacyThemeTints} from './types'

/**
 * @internal
 */
export function _buildTints(bg: string, mid: string, fg: string): LegacyThemeTints {
  return {
    50: mix(0.1, mid, bg),
    100: mix(0.2, mid, bg),
    200: mix(0.4, mid, bg),
    300: mix(0.6, mid, bg),
    400: mix(0.8, mid, bg),
    500: mid,
    600: mix(0.8, mid, fg),
    700: mix(0.6, mid, fg),
    800: mix(0.4, mid, fg),
    900: mix(0.2, mid, fg),
    950: mix(0.1, mid, fg),
  }
}

/**
 * @internal
 */
export function _toHex(color: string): string {
  const {red, green, blue} = parseToRgb(color)
  return rgb(red, green, blue)
}

/**
 * @internal
 */
export function _isDark(bg: string, fg: string): boolean {
  return getLuminance(bg) < getLuminance(fg)
}

/**
 * Blend two colors using the "screen" blend mode
 * @internal
 */
export function _multiply(bg: string, fg: string): string {
  const b = parseColor(bg)
  const s = parseColor(fg)
  const hex = rgbToHex(multiply(b, s))

  return hex
}

/**
 * Blend two colors using the "screen" blend mode
 * @internal
 */
export function _screen(bg: string, fg: string): string {
  const b = parseColor(bg)
  const s = parseColor(fg)
  const hex = rgbToHex(screen(b, s))

  return hex
}
