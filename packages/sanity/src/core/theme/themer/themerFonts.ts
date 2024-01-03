import {deepEquals} from '../../validation/util/deepEquals'
import {StudioTheme} from '../types'

/**
 * @internal
 * This are the default fonts provided by the Sanity Themer API, used to compare with the
 * theme provided by the user, if it matches we know that the user has not changed the fonts.
 * If it doesn't match we know that the user has changed the fonts and we need to use the user fonts instead.
 */
export const THEMER_FONTS = {
  code: {
    family: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    sizes: [
      {
        ascenderHeight: 3,
        descenderHeight: 3,
        fontSize: 10,
        iconSize: 17,
        lineHeight: 13,
        letterSpacing: 0,
      },
      {
        ascenderHeight: 4,
        descenderHeight: 4,
        fontSize: 13,
        iconSize: 21,
        lineHeight: 17,
        letterSpacing: 0,
      },
      {
        ascenderHeight: 5,
        descenderHeight: 5,
        fontSize: 16,
        iconSize: 25,
        lineHeight: 21,
        letterSpacing: 0,
      },
      {
        ascenderHeight: 6,
        descenderHeight: 6,
        fontSize: 19,
        iconSize: 29,
        lineHeight: 25,
        letterSpacing: 0,
      },
      {
        ascenderHeight: 7,
        descenderHeight: 7,
        fontSize: 22,
        iconSize: 33,
        lineHeight: 29,
        letterSpacing: 0,
      },
    ],
  },
  heading: {
    family:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Liberation Sans", Helvetica, Arial, system-ui, sans-serif',
    weights: {
      regular: 700,
      medium: 800,
      semibold: 900,
      bold: 900,
    },
    sizes: [
      {
        ascenderHeight: 4,
        descenderHeight: 4,
        fontSize: 12,
        iconSize: 17,
        lineHeight: 17,
        letterSpacing: 0,
      },
      {
        ascenderHeight: 5,
        descenderHeight: 5,
        fontSize: 16,
        iconSize: 25,
        lineHeight: 21,
        letterSpacing: 0,
      },
      {
        ascenderHeight: 6,
        descenderHeight: 6,
        fontSize: 21,
        iconSize: 33,
        lineHeight: 27,
        letterSpacing: 0,
      },
      {
        ascenderHeight: 7,
        descenderHeight: 7,
        fontSize: 27,
        iconSize: 41,
        lineHeight: 33,
        letterSpacing: 0,
      },
      {
        ascenderHeight: 8,
        descenderHeight: 8,
        fontSize: 33,
        iconSize: 49,
        lineHeight: 39,
        letterSpacing: 0,
      },
      {
        ascenderHeight: 9,
        descenderHeight: 9,
        fontSize: 38,
        iconSize: 53,
        lineHeight: 45,
        letterSpacing: 0,
      },
    ],
  },
  label: {
    family:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Liberation Sans", system-ui, sans-serif',
    weights: {
      regular: 600,
      medium: 700,
      semibold: 800,
      bold: 900,
    },
    sizes: [
      {
        ascenderHeight: 2,
        descenderHeight: 2,
        fontSize: 9.8,
        iconSize: 15,
        lineHeight: 11,
        letterSpacing: 0.5,
      },
      {
        ascenderHeight: 2,
        descenderHeight: 2,
        fontSize: 11.25,
        iconSize: 17,
        lineHeight: 12,
        letterSpacing: 0.5,
      },
      {
        ascenderHeight: 2,
        descenderHeight: 2,
        fontSize: 12.75,
        iconSize: 19,
        lineHeight: 13,
        letterSpacing: 0.5,
      },
      {
        ascenderHeight: 2,
        descenderHeight: 2,
        fontSize: 14,
        iconSize: 21,
        lineHeight: 14,
        letterSpacing: 0.5,
      },
      {
        ascenderHeight: 2,
        descenderHeight: 2,
        fontSize: 15.5,
        iconSize: 23,
        lineHeight: 15,
        letterSpacing: 0.5,
      },
    ],
  },
  text: {
    family:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Liberation Sans", Helvetica, Arial, system-ui, sans-serif',
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    sizes: [
      {
        ascenderHeight: 3,
        descenderHeight: 3,
        fontSize: 10,
        iconSize: 17,
        lineHeight: 13,
        letterSpacing: 0,
      },
      {
        ascenderHeight: 4,
        descenderHeight: 4,
        fontSize: 13,
        iconSize: 21,
        lineHeight: 17,
        letterSpacing: 0,
      },
      {
        ascenderHeight: 5,
        descenderHeight: 5,
        fontSize: 16,
        iconSize: 25,
        lineHeight: 21,
        letterSpacing: 0,
      },
      {
        ascenderHeight: 6,
        descenderHeight: 6,
        fontSize: 19,
        iconSize: 29,
        lineHeight: 25,
        letterSpacing: 0,
      },
      {
        ascenderHeight: 7,
        descenderHeight: 7,
        fontSize: 22,
        iconSize: 33,
        lineHeight: 29,
        letterSpacing: 0,
      },
    ],
  },
}

export function usesLegacyThemerFonts(fonts?: StudioTheme['fonts']): boolean {
  if (!fonts) return false
  return deepEquals(fonts, THEMER_FONTS)
}
