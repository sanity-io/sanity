import {hues} from '@sanity/color'
import {createColorTheme, rgba, ThemeColorSchemes} from '@sanity/ui/theme'
import {_multiply, _screen, _isDark} from './helpers'
import {LegacyPalette} from './palette'
import {LegacyTones} from './tones'
import {LegacyThemeTints} from './types'

const NEUTRAL_TONES = ['default', 'transparent']

export function buildColor(
  legacyPalette: LegacyPalette,
  legacyTones: LegacyTones,
): ThemeColorSchemes {
  return createColorTheme({
    base: ({dark: navbar, name}) => {
      const stateTones = navbar ? legacyTones.state.navbar : legacyTones.state.default
      const dark = stateTones.dark
      const blend = navbar ? _screen : _multiply
      const tints = stateTones[name] || stateTones.default

      if (name === 'default') {
        const skeletonFrom = stateTones.default[100]

        return {
          fg: stateTones.fg,
          bg: stateTones.bg,
          border: stateTones.default[200],
          focusRing: legacyPalette.focus.base,
          shadow: {
            outline: rgba(stateTones.default[500], 0.4),
            umbra: rgba(dark ? legacyPalette.black : stateTones.default[500], 0.2),
            penumbra: rgba(dark ? legacyPalette.black : stateTones.default[500], 0.14),
            ambient: rgba(dark ? legacyPalette.black : stateTones.default[500], 0.12),
          },
          skeleton: {
            from: skeletonFrom,
            to: rgba(skeletonFrom, 0.5),
          },
        }
      }

      if (name === 'transparent') {
        const bg = tints[50]
        const skeletonFrom = blend(bg, tints[100])

        return {
          fg: tints[900],
          bg,
          border: tints[300],
          focusRing: legacyPalette.focus.base,
          shadow: {
            outline: rgba(tints[500], dark ? 0.2 : 0.4),
            umbra: rgba(dark ? legacyPalette.black : tints[500], 0.2),
            penumbra: rgba(dark ? legacyPalette.black : tints[500], 0.14),
            ambient: rgba(dark ? legacyPalette.black : tints[500], 0.12),
          },
          skeleton: {
            from: skeletonFrom,
            to: rgba(skeletonFrom, 0.5),
          },
        }
      }

      const bg = tints[50]
      const skeletonFrom = blend(bg, tints[100])

      return {
        fg: tints[900],
        bg,
        border: tints[200],
        focusRing: tints[500],
        shadow: {
          outline: rgba(tints[500], dark ? 0.2 : 0.4),
          umbra: rgba(dark ? legacyPalette.black : tints[500], 0.2),
          penumbra: rgba(dark ? legacyPalette.black : tints[500], 0.14),
          ambient: rgba(dark ? legacyPalette.black : tints[500], 0.12),
        },
        skeleton: {
          from: skeletonFrom,
          to: rgba(skeletonFrom, 0.5),
        },
      }
    },

    solid: ({base, dark: navbar, name, state, tone}) => {
      const buttonTones = navbar ? legacyTones.button.navbar : legacyTones.button.default
      const dark = buttonTones.dark
      const blend = dark ? _screen : _multiply
      const blendInvert = dark ? _multiply : _screen
      const defaultTints = buttonTones[name] || buttonTones.default
      const isNeutral = NEUTRAL_TONES.includes(name) && NEUTRAL_TONES.includes(tone)
      let tints = buttonTones[tone === 'default' ? name : tone] || defaultTints

      if (state === 'disabled') {
        tints = defaultTints

        const bg = blend(base.bg, tints[200])
        const skeletonFrom = blendInvert(bg, tints[800])

        return {
          bg,
          border: blend(base.bg, tints[200]),
          fg: blend(base.bg, buttonTones.bg),
          icon: blend(base.bg, buttonTones.bg),
          muted: {
            fg: blend(base.bg, tints[50]),
          },
          accent: {
            fg: blend(base.bg, tints[50]),
          },
          link: {
            fg: blend(base.bg, tints[50]),
          },
          code: {
            bg,
            fg: blend(base.bg, tints[50]),
          },
          skeleton: {
            from: skeletonFrom,
            to: rgba(skeletonFrom, 0.5),
          },
        }
      }

      if (state === 'hovered') {
        const bg = blend(base.bg, tints[600])
        const skeletonFrom = blendInvert(bg, tints[800])

        return {
          bg,
          border: blend(base.bg, tints[600]),
          fg: blend(base.bg, buttonTones.bg),
          icon: blend(base.bg, buttonTones.bg),
          muted: {
            fg: blend(base.bg, tints[200]),
          },
          accent: {
            fg: blendInvert(bg, buttonTones.critical[300]),
          },
          link: {
            fg: blendInvert(bg, buttonTones.primary[200]),
          },
          code: {
            bg: blend(bg, tints[50]),
            fg: blend(base.bg, tints[200]),
          },
          skeleton: {
            from: skeletonFrom,
            to: rgba(skeletonFrom, 0.5),
          },
        }
      }

      if (state === 'pressed') {
        const bg = blend(base.bg, tints[800])
        const skeletonFrom = blendInvert(bg, tints[800])

        return {
          bg,
          border: blend(base.bg, tints[800]),
          fg: blend(base.bg, buttonTones.bg),
          icon: blend(base.bg, buttonTones.bg),
          muted: {
            fg: blend(base.bg, tints[200]),
          },
          accent: {
            fg: blendInvert(bg, buttonTones.critical[300]),
          },
          link: {
            fg: blendInvert(bg, buttonTones.primary[200]),
          },
          code: {
            bg: blend(bg, tints[50]),
            fg: blend(base.bg, tints[200]),
          },
          skeleton: {
            from: skeletonFrom,
            to: rgba(skeletonFrom, 0.5),
          },
        }
      }

      if (state === 'selected') {
        if (isNeutral) {
          tints = buttonTones.primary
        }

        const bg = blend(base.bg, tints[800])
        const skeletonFrom = blendInvert(bg, tints[800])

        return {
          bg,
          border: blend(base.bg, tints[800]),
          fg: blend(base.bg, buttonTones.bg),
          icon: blend(base.bg, buttonTones.bg),
          muted: {
            fg: blend(base.bg, tints[200]),
          },
          accent: {
            fg: blendInvert(bg, buttonTones.critical[300]),
          },
          link: {
            fg: blendInvert(bg, buttonTones.primary[200]),
          },
          code: {
            bg: blend(bg, tints[50]),
            fg: blend(base.bg, tints[200]),
          },
          skeleton: {
            from: skeletonFrom,
            to: rgba(skeletonFrom, 0.5),
          },
        }
      }

      const bg = blend(base.bg, tints[500])
      const skeletonFrom = blendInvert(bg, tints[800])

      return {
        bg,
        border: blend(base.bg, tints[500]),
        fg: blend(base.bg, buttonTones.bg),
        icon: blend(base.bg, buttonTones.bg),
        muted: {
          fg: blend(base.bg, tints[100]),
        },
        accent: {
          fg: blendInvert(bg, buttonTones.critical[200]),
        },
        link: {
          fg: blendInvert(bg, buttonTones.primary[100]),
        },
        code: {
          bg: blend(bg, tints[50]),
          fg: blend(base.bg, tints[100]),
        },
        skeleton: {
          from: skeletonFrom,
          to: rgba(skeletonFrom, 0.5),
        },
      }
    },

    muted: ({base, dark: navbar, name, state, tone}) => {
      const stateTones = navbar ? legacyTones.state.navbar : legacyTones.state.default
      const dark = stateTones.dark
      const blend = dark ? _screen : _multiply
      const defaultTints = stateTones[name] || stateTones.default
      const isNeutral = NEUTRAL_TONES.includes(name) && NEUTRAL_TONES.includes(tone)

      let tints: LegacyThemeTints = stateTones[tone === 'default' ? name : tone] || defaultTints

      if (state === 'disabled') {
        tints = defaultTints

        const bg = base.bg
        const skeletonFrom = blend(bg, tints[100])

        return {
          bg,
          border: blend(base.bg, tints[50]),
          fg: blend(base.bg, tints[200]),
          icon: blend(base.bg, tints[200]),
          muted: {
            fg: blend(bg, tints[100]),
          },
          accent: {
            fg: blend(bg, tints[100]),
          },
          link: {
            fg: blend(bg, tints[100]),
          },
          code: {
            bg,
            fg: blend(bg, tints[100]),
          },
          skeleton: {
            from: skeletonFrom,
            to: rgba(skeletonFrom, 0.5),
          },
        }
      }

      if (state === 'hovered') {
        const bg = blend(base.bg, tints[50])
        const skeletonFrom = blend(bg, tints[100])

        return {
          bg,
          border: blend(bg, tints[100]),
          fg: blend(base.bg, tints[900]),
          icon: blend(base.bg, tints[900]),
          muted: {
            fg: blend(base.bg, tints[600]),
          },
          accent: {
            fg: blend(base.bg, stateTones.critical[500]),
          },
          link: {
            fg: blend(base.bg, stateTones.primary[600]),
          },
          code: {
            bg: blend(bg, tints[50]),
            fg: blend(base.bg, tints[600]),
          },
          skeleton: {
            from: skeletonFrom,
            to: rgba(skeletonFrom, 0.5),
          },
        }
      }

      if (state === 'pressed') {
        if (isNeutral) {
          tints = stateTones.primary
        }

        const bg = blend(base.bg, tints[100])
        const skeletonFrom = blend(bg, tints[100])

        return {
          bg,
          border: blend(bg, tints[100]),
          fg: blend(base.bg, tints[800]),
          icon: blend(base.bg, tints[800]),
          muted: {
            fg: blend(base.bg, tints[600]),
          },
          accent: {
            fg: blend(bg, stateTones.critical[500]),
          },
          link: {
            fg: blend(bg, stateTones.primary[600]),
          },
          code: {
            bg: blend(bg, tints[50]),
            fg: blend(bg, tints[600]),
          },
          skeleton: {
            from: skeletonFrom,
            to: rgba(skeletonFrom, 0.5),
          },
        }
      }

      if (state === 'selected') {
        if (isNeutral) {
          tints = stateTones.primary
        }

        const bg = blend(base.bg, tints[100])
        const skeletonFrom = blend(bg, tints[100])

        return {
          bg,
          border: blend(bg, tints[100]),
          fg: blend(bg, tints[800]),
          icon: blend(bg, tints[800]),
          muted: {
            fg: blend(bg, tints[600]),
          },
          accent: {
            fg: blend(bg, stateTones.critical[500]),
          },
          link: {
            fg: blend(bg, stateTones.primary[600]),
          },
          code: {
            bg: blend(bg, tints[50]),
            fg: blend(bg, tints[600]),
          },
          skeleton: {
            from: skeletonFrom,
            to: rgba(skeletonFrom, 0.5),
          },
        }
      }

      const bg = base.bg
      const skeletonFrom = blend(base.bg, tints[100])

      return {
        bg,
        border: blend(bg, tints[100]),
        fg: blend(bg, tints[700]),
        icon: blend(bg, tints[700]),
        muted: {
          fg: blend(bg, tints[600]),
        },
        accent: {
          fg: blend(bg, stateTones.critical[500]),
        },
        link: {
          fg: blend(bg, stateTones.primary[600]),
        },
        code: {
          bg: blend(bg, tints[50]),
          fg: blend(bg, tints[600]),
        },
        skeleton: {
          from: skeletonFrom,
          to: rgba(skeletonFrom, 0.5),
        },
      }
    },

    button: ({base, mode, muted, solid}) => {
      if (mode === 'bleed') {
        return {
          enabled: {
            ...muted.enabled,
            border: muted.enabled.bg,
          },
          hovered: {
            ...muted.hovered,
            border: muted.hovered.bg,
          },
          pressed: {
            ...muted.pressed,
            border: muted.pressed.bg,
          },
          selected: {
            ...muted.selected,
            border: muted.selected.bg,
          },
          disabled: {
            ...muted.disabled,
            border: muted.disabled.bg,
          },
        }
      }

      if (mode === 'ghost') {
        return {
          ...solid,
          enabled: {
            ...muted.enabled,
            border: base.border,
          },
          disabled: muted.disabled,
        }
      }

      return solid
    },

    card: ({base, dark: navbar, muted, name, solid, state}) => {
      if (state === 'hovered') {
        return muted[name].hovered
      }

      if (state === 'disabled') {
        return muted[name].disabled
      }

      const isNeutral = NEUTRAL_TONES.includes(name)
      const stateTones = navbar ? legacyTones.state.navbar : legacyTones.state.default
      const tints: LegacyThemeTints = stateTones[name] || stateTones.default

      const dark = stateTones.dark
      const blend = dark ? _screen : _multiply

      if (state === 'pressed') {
        if (isNeutral) {
          return muted.primary.pressed
        }

        return muted[name].pressed
      }

      if (state === 'selected') {
        if (isNeutral) {
          return solid.primary.enabled
        }

        return solid[name].enabled
      }

      const bg = base.bg
      const skeletonFrom = blend(base.bg, tints[dark ? 900 : 100])

      return {
        bg,
        fg: base.fg,
        icon: base.fg,
        border: base.border,
        muted: {
          fg: blend(base.bg, tints[dark ? 400 : 600]),
        },
        accent: {
          fg: blend(base.bg, stateTones.critical[dark ? 400 : 500]),
        },
        link: {
          fg: blend(base.bg, stateTones.primary[dark ? 400 : 600]),
        },
        code: {
          bg: blend(base.bg, tints[dark ? 950 : 50]),
          fg: tints[dark ? 400 : 600],
        },
        skeleton: {
          from: skeletonFrom,
          to: rgba(skeletonFrom, 0.5),
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
          bg2: blend(base.bg, tints[50]),
          fg: blend(base.bg, tints[700]),
          border: blend(base.bg, tints[200]),
          placeholder: blend(base.bg, tints[400]),
        }
      }

      if (state === 'hovered') {
        return {
          bg: base.bg,
          bg2: base.bg,
          fg: base.fg,
          border: blend(base.bg, hues.gray[300].hex),
          placeholder: blend(base.bg, hues.gray[400].hex),
        }
      }

      if (state === 'disabled') {
        return {
          bg: blend(base.bg, hues.gray[50].hex),
          bg2: blend(base.bg, hues.gray[50].hex),
          fg: blend(base.bg, hues.gray[200].hex),
          border: blend(base.bg, hues.gray[100].hex),
          placeholder: blend(base.bg, hues.gray[100].hex),
        }
      }

      if (state === 'readOnly') {
        return {
          bg: blend(base.bg, hues.gray[50].hex),
          bg2: blend(base.bg, hues.gray[50].hex),
          fg: blend(base.bg, hues.gray[800].hex),
          border: blend(base.bg, hues.gray[200].hex),
          placeholder: blend(base.bg, hues.gray[400].hex),
        }
      }

      return {
        bg: base.bg,
        bg2: base.bg,
        fg: base.fg,
        border: base.border,
        placeholder: blend(base.bg, hues.gray[700].hex),
      }
    },

    selectable: ({base, muted, tone, solid, state}) => {
      if (state === 'enabled') {
        return {
          ...muted[tone].enabled,
          bg: base.bg,
        }
      }

      if (state === 'pressed') {
        if (tone === 'default') {
          return muted.primary.pressed
        }

        return muted[tone].pressed
      }

      if (state === 'selected') {
        if (tone === 'default') {
          return solid.primary.enabled
        }

        return solid[tone].enabled
      }

      if (state === 'disabled') {
        return {
          ...muted[tone].disabled,
          bg: base.bg,
        }
      }

      return muted[tone][state]
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
}
