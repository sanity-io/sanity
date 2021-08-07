// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import cssCustomProperties from 'sanity:css-custom-properties'
import {_toHex} from './helpers'

export const legacyPalette = {
  black: _toHex(cssCustomProperties['--black']),
  component: {
    bg: _toHex(cssCustomProperties['--component-bg']),
    fg: _toHex(cssCustomProperties['--component-text-color']),
  },
  defaultButton: {
    default: {
      base: _toHex(cssCustomProperties['--default-button-color']),
    },
    primary: {
      base: _toHex(cssCustomProperties['--default-button-primary-color']),
    },
    success: {
      base: _toHex(cssCustomProperties['--default-button-success-color']),
    },
    warning: {
      base: _toHex(cssCustomProperties['--default-button-warning-color']),
    },
    danger: {
      base: _toHex(cssCustomProperties['--default-button-danger-color']),
    },
  },
  focus: {
    base: _toHex(cssCustomProperties['--focus-color']),
  },
  gray: {
    base: _toHex(cssCustomProperties['--gray-base']),
  },
  mainNavigation: {
    bg: _toHex(cssCustomProperties['--main-navigation-color']),
    fg: _toHex(cssCustomProperties['--main-navigation-color--inverted']),
  },
  state: {
    info: {
      fg: _toHex(cssCustomProperties['--state-info-color']),
    },
    success: {
      fg: _toHex(cssCustomProperties['--state-success-color']),
    },
    warning: {
      fg: _toHex(cssCustomProperties['--state-warning-color']),
    },
    danger: {
      fg: _toHex(cssCustomProperties['--state-danger-color']),
    },
  },
}
