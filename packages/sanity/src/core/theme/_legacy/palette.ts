import {_toHex} from './helpers'
import {LegacyThemeProps} from './types'

export interface LegacyPalette {
  black: string
  component: {
    bg: string
    fg: string
  }
  defaultButton: {
    default: {
      base: string
    }
    primary: {
      base: string
    }
    success: {
      base: string
    }
    warning: {
      base: string
    }
    danger: {
      base: string
    }
  }
  focus: {
    base: string
  }
  gray: {
    base: string
  }
  mainNavigation: {
    bg: string
    fg: string
  }
  state: {
    info: {
      fg: string
    }
    success: {
      fg: string
    }
    warning: {
      fg: string
    }
    danger: {
      fg: string
    }
  }
}

export function buildLegacyPalette(cssCustomProperties: LegacyThemeProps): LegacyPalette {
  return {
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
}
