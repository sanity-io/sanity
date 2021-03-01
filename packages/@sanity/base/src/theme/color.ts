import {color as hues} from '@sanity/color'
import {createColorTheme, rgba} from '@sanity/ui'
import {_multiply, _screen, _isDark} from './helpers'
import {legacyPalette} from './legacyPalette'
import {legacyTones} from './legacyTones'

export const color = createColorTheme({
  base: ({dark: navbar, name}) => {
    const stateTones = navbar ? legacyTones.state.navbar : legacyTones.state.default
    const dark = stateTones.dark

    if (name === 'default') {
      return {
        fg: stateTones.fg,
        bg: stateTones.bg,
        border: stateTones.default[200],
        focusRing: legacyPalette.focus.base,
        shadow: {
          outline: rgba(stateTones.default[500], dark ? 0.2 : 0.4),
          umbra: rgba(dark ? legacyPalette.black : stateTones.default[500], 0.2),
          penumbra: rgba(dark ? legacyPalette.black : stateTones.default[500], 0.14),
          ambient: rgba(dark ? legacyPalette.black : stateTones.default[500], 0.12),
        },
      }
    }

    if (name === 'transparent') {
      const tints = stateTones.default

      return {
        fg: tints[900],
        bg: tints[50],
        border: tints[300],
        focusRing: legacyPalette.focus.base,
        shadow: {
          outline: rgba(tints[500], dark ? 0.2 : 0.4),
          umbra: rgba(dark ? legacyPalette.black : tints[500], 0.2),
          penumbra: rgba(dark ? legacyPalette.black : tints[500], 0.14),
          ambient: rgba(dark ? legacyPalette.black : tints[500], 0.12),
        },
      }
    }

    const tints = stateTones[name] || stateTones.default

    return {
      fg: tints[900],
      bg: tints[50],
      border: tints[200],
      focusRing: tints[500],
      shadow: {
        outline: rgba(tints[500], dark ? 0.2 : 0.4),
        umbra: rgba(dark ? legacyPalette.black : tints[500], 0.2),
        penumbra: rgba(dark ? legacyPalette.black : tints[500], 0.14),
        ambient: rgba(dark ? legacyPalette.black : tints[500], 0.12),
      },
    }
  },

  solid: ({base, dark: navbar, state, tone}) => {
    const buttonTones = navbar ? legacyTones.button.navbar : legacyTones.button.default
    const dark = buttonTones.dark
    const blend = dark ? _screen : _multiply
    const tints = buttonTones[tone] || buttonTones.default

    if (state === 'disabled') {
      return {
        bg: blend(base.bg, buttonTones.default[200]),
        border: blend(base.bg, buttonTones.default[200]),
        fg: blend(base.bg, buttonTones.bg),
      }
    }

    if (state === 'hovered') {
      return {
        bg: blend(base.bg, tints[600]),
        border: blend(base.bg, tints[600]),
        fg: blend(base.bg, buttonTones.bg),
      }
    }

    if (state === 'pressed') {
      return {
        bg: blend(base.bg, tints[800]),
        border: blend(base.bg, tints[800]),
        fg: blend(base.bg, buttonTones.bg),
      }
    }

    if (state === 'selected') {
      return {
        bg: blend(base.bg, tints[800]),
        border: blend(base.bg, tints[800]),
        fg: blend(base.bg, buttonTones.bg),
      }
    }

    // state: "enabled" | unknown
    return {
      bg: blend(base.bg, tints[500]),
      border: blend(base.bg, tints[500]),
      fg: blend(base.bg, buttonTones.bg),
    }
  },

  muted: ({base, dark: navbar, state, tone}) => {
    const stateTones = navbar ? legacyTones.state.navbar : legacyTones.state.default
    const dark = stateTones.dark
    const blend = dark ? _screen : _multiply
    const tints = stateTones[tone] || stateTones.default

    if (state === 'disabled') {
      return {
        bg: blend(base.bg, stateTones.default[50]),
        border: blend(base.bg, stateTones.default[50]),
        fg: blend(base.bg, stateTones.default[200]),
      }
    }

    if (state === 'hovered') {
      return {
        bg: blend(base.bg, tints[50]),
        border: blend(base.bg, tints[50]),
        fg: blend(base.bg, tints[900]),
      }
    }

    if (state === 'pressed') {
      return {
        bg: blend(base.bg, tints[100]),
        border: blend(base.bg, tints[100]),
        fg: blend(base.bg, tints[900]),
      }
    }

    if (state === 'selected') {
      return {
        bg: blend(base.bg, tints[100]),
        border: blend(base.bg, tints[100]),
        fg: blend(base.bg, tints[900]),
      }
    }

    return {
      bg: blend(base.bg, tints[100]),
      border: blend(base.bg, tints[100]),
      fg: blend(base.bg, tints[700]),
    }
  },

  button: ({base, mode, muted, solid}) => {
    if (mode === 'bleed') {
      return {
        ...muted,
        enabled: {
          ...muted.enabled,
          bg: base.bg,
          border: base.bg,
        },
        disabled: {
          ...muted.disabled,
          bg: base.bg,
          border: base.bg,
        },
      }
    }

    if (mode === 'ghost') {
      return {
        ...solid,
        enabled: {...muted.enabled, bg: base.bg, border: base.border},
        disabled: {
          ...muted.disabled,
          bg: base.bg,
        },
      }
    }

    return solid
  },

  card: ({base, dark: navbar, muted, name, state}) => {
    const stateTones = navbar ? legacyTones.state.navbar : legacyTones.state.default

    let dark = stateTones.dark
    let blend = dark ? _screen : _multiply

    if (state === 'selected') {
      const tint = ['default', 'transparent'].includes(name) ? stateTones.primary : stateTones[name]
      const bg = tint[500]
      const fg = stateTones.bg

      dark = _isDark(bg, fg)
      blend = dark ? _multiply : _screen

      return {
        bg,
        fg,
        border: tint[400],
        muted: {
          fg: blend(bg, stateTones.default[300]),
        },
        accent: {
          fg: blend(bg, stateTones.critical[500]),
        },
        link: {
          fg: blend(bg, stateTones.primary[300]),
        },
        code: {
          bg: blend(bg, stateTones.default[950]),
          fg: blend(bg, stateTones.default[300]),
        },
      }
    }

    if (state === 'hovered') {
      const bg = muted.hovered.bg

      return {
        ...muted.hovered,
        border: blend(bg, base.border),
        muted: {
          fg: blend(bg, stateTones.default[700]),
        },
        accent: {
          fg: blend(bg, stateTones.critical[500]),
        },
        link: {
          fg: blend(bg, stateTones.primary[700]),
        },
        code: {
          bg: blend(bg, stateTones.default[50]),
          fg: stateTones.default[600],
        },
      }
    }

    if (state === 'pressed') {
      return {
        ...muted.pressed,
        fg: base.fg,
        muted: {
          fg: blend(muted.pressed.bg, stateTones.default[700]),
        },
        accent: {
          fg: blend(muted.pressed.bg, stateTones.critical[500]),
        },
        link: {
          fg: blend(muted.pressed.bg, stateTones.primary[700]),
        },
        code: {
          bg: blend(muted.pressed.bg, stateTones.default[50]),
          fg: stateTones.default[700],
        },
      }
    }

    if (state === 'disabled') {
      return {
        ...muted.disabled,
        muted: {
          fg: muted.disabled.fg,
        },
        accent: {
          fg: muted.disabled.fg,
        },
        link: {
          fg: muted.disabled.fg,
        },
        code: {
          bg: 'transparent',
          fg: muted.disabled.fg,
        },
      }
    }

    return {
      bg: base.bg,
      fg: base.fg,
      border: base.border,
      muted: {
        fg: blend(base.bg, stateTones.default[700]),
      },
      accent: {
        fg: blend(base.bg, stateTones.critical[500]),
      },
      link: {
        fg: blend(base.bg, stateTones.primary[700]),
      },
      code: {
        bg: blend(base.bg, stateTones.default[50]),
        fg: stateTones.default[700],
      },
    }
  },

  input: ({base, dark: navbar, mode, state}) => {
    const stateTones = navbar ? legacyTones.state.navbar : legacyTones.state.default
    const dark = stateTones.dark
    const blend = dark ? _screen : _multiply

    if (mode === 'invalid') {
      const tints = stateTones.critical

      return {
        bg: blend(base.bg, tints[50]),
        fg: blend(base.bg, tints[700]),
        border: blend(base.bg, tints[200]),
        placeholder: blend(base.bg, tints[700]),
      }
    }

    if (state === 'hovered') {
      return {
        bg: base.bg,
        fg: base.fg,
        border: blend(base.bg, hues.gray[300].hex),
        placeholder: blend(base.bg, hues.gray[700].hex),
      }
    }

    if (state === 'disabled') {
      return {
        bg: blend(base.bg, hues.gray[50].hex),
        fg: blend(base.bg, hues.gray[200].hex),
        border: blend(base.bg, hues.gray[100].hex),
        placeholder: blend(base.bg, hues.gray[100].hex),
      }
    }

    return {
      bg: base.bg,
      fg: base.fg,
      border: base.border,
      placeholder: blend(base.bg, hues.gray[700].hex),
    }
  },

  spot: ({base, key}) => {
    const dark = _isDark(base.bg, base.fg)
    const blend = dark ? _screen : _multiply

    return blend(base.bg, hues[key][dark ? 400 : 500].hex)
  },

  syntax: ({base, dark: navbar}) => {
    const stateTones = navbar ? legacyTones.state.navbar : legacyTones.state.default
    const dark = stateTones.dark
    const blend = dark ? _screen : _multiply
    const mainShade = 600
    const secondaryShade = 400

    return {
      atrule: blend(base.bg, hues.purple[mainShade].hex),
      attrName: blend(base.bg, stateTones.positive[mainShade]),
      attrValue: blend(base.bg, stateTones.caution[mainShade]),
      attribute: blend(base.bg, stateTones.caution[mainShade]),
      boolean: blend(base.bg, hues.purple[mainShade].hex),
      builtin: blend(base.bg, hues.purple[mainShade].hex),
      cdata: blend(base.bg, stateTones.caution[mainShade]),
      char: blend(base.bg, stateTones.caution[mainShade]),
      class: blend(base.bg, hues.orange[mainShade].hex),
      className: blend(base.bg, hues.cyan[mainShade].hex),
      comment: blend(base.bg, stateTones.default[secondaryShade]),
      constant: blend(base.bg, hues.purple[mainShade].hex),
      deleted: blend(base.bg, stateTones.critical[mainShade]),
      doctype: blend(base.bg, stateTones.default[secondaryShade]),
      entity: blend(base.bg, stateTones.critical[mainShade]),
      function: blend(base.bg, stateTones.positive[mainShade]),
      hexcode: blend(base.bg, stateTones.primary[mainShade]),
      id: blend(base.bg, hues.purple[mainShade].hex),
      important: blend(base.bg, hues.purple[mainShade].hex),
      inserted: blend(base.bg, stateTones.caution[mainShade]),
      keyword: blend(base.bg, hues.magenta[mainShade].hex),
      number: blend(base.bg, hues.purple[mainShade].hex),
      operator: blend(base.bg, hues.magenta[mainShade].hex),
      prolog: blend(base.bg, stateTones.default[secondaryShade]),
      property: blend(base.bg, stateTones.primary[mainShade]),
      pseudoClass: blend(base.bg, stateTones.caution[mainShade]),
      pseudoElement: blend(base.bg, stateTones.caution[mainShade]),
      punctuation: blend(base.bg, stateTones.default[mainShade]),
      regex: blend(base.bg, stateTones.primary[mainShade]),
      selector: blend(base.bg, stateTones.critical[mainShade]),
      string: blend(base.bg, stateTones.caution[mainShade]),
      symbol: blend(base.bg, hues.purple[mainShade].hex),
      tag: blend(base.bg, stateTones.critical[mainShade]),
      unit: blend(base.bg, hues.orange[mainShade].hex),
      url: blend(base.bg, stateTones.critical[mainShade]),
      variable: blend(base.bg, stateTones.critical[mainShade]),
    }
  },
})
