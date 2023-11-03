import React, {type HTMLProps, type RefAttributes} from 'react'
import {type HotkeysProps as UIHotkeysProps, Hotkeys as UIHotkeys} from '@sanity/ui'

/**
 * Properties for the `Hotkeys` component.
 *
 * @public
 */
export type HotkeysProps = UIHotkeysProps & {
  /**
   * Whether to make the keys platform-aware (eg `alt` to `option` on Apple devices).
   *
   * @defaultValue true
   */
  makePlatformAware?: boolean
} & Omit<HTMLProps<HTMLElement>, 'ref' | 'size' | 'as'> &
  RefAttributes<HTMLElement>

/**
 * Renders given `keys` as "keycaps" visually.
 *
 * This is a wrapper around `@sanity/ui`'s `Hotkeys` component, which allows for altering keys
 * (eg `alt` to `option`) on Apple devices unless `makePlatformAware` is set to `false`.
 *
 * @param props - Properties to render with
 * @returns React element
 * @public
 */
export function Hotkeys({makePlatformAware = true, keys: hotKeys = [], ...props}: HotkeysProps) {
  const keys = makePlatformAware ? hotKeys.map(platformifyKey) : hotKeys
  return <UIHotkeys {...props} keys={keys} />
}

/**
 * @internal
 */
const IS_APPLE_DEVICE =
  typeof navigator === 'undefined' || typeof navigator.platform !== 'string'
    ? false
    : /Mac|iPod|iPhone|iPad/.test(navigator.platform || '')

/**
 * Given key 'Alt', or 'Option' (case-insensitive), return the platform-appropriate key name
 * (eg 'Alt' on non-Apple devices, 'Option' on Apple devices).
 *
 * @param key - Key to platformify
 * @returns Platform-appropriate key name
 * @internal
 */
function platformifyKey(key: string): string {
  const lowerKey = key.toLowerCase()

  if (lowerKey === 'alt' && IS_APPLE_DEVICE) {
    return matchCase(key, 'option')
  }

  if (lowerKey === 'option' && !IS_APPLE_DEVICE) {
    return matchCase(key, 'alt')
  }

  return key
}

/**
 * Apply the case (lowercase/uppercase) of `original` to `target`, character by character,
 * eg matching ALL CAPS, all lowercase or Mixed Case.
 *
 * @param original - The original string to match case of
 * @param target - The target string to apply case to
 * @returns Target string with case applied from original
 * @internal
 */
function matchCase(original: string, target: string): string {
  const orgLength = original.length

  return target.replace(/./g, (char, i) => {
    // Replace character by character matching case of original
    // If running out of original, just return the target case as-is
    return i < orgLength && original[i] === original[i].toUpperCase() ? char.toUpperCase() : char
  })
}
