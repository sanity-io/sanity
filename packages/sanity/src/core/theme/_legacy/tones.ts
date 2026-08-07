import {_buildTints, _isDark} from './helpers'
import {type LegacyPalette} from './palette'
import {type LegacyThemeTints} from './types'

/**
 * @deprecated – Will be removed in upcoming major version
 */
export interface LegacyTones {
  button: {
    default: {
      bg: string
      fg: string
      dark: boolean

      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      default: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      transparent: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      primary: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      positive: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      caution: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      critical: LegacyThemeTints
    }

    navbar: {
      bg: string
      fg: string
      dark: boolean

      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      default: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      transparent: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      primary: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      positive: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      caution: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      critical: LegacyThemeTints
    }
  }

  state: {
    default: {
      bg: string
      fg: string
      dark: boolean

      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      default: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      transparent: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      primary: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      positive: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      caution: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      critical: LegacyThemeTints
    }

    navbar: {
      bg: string
      fg: string
      dark: boolean

      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      default: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      transparent: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      primary: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      positive: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      caution: LegacyThemeTints
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      critical: LegacyThemeTints
    }
  }
}

/**
 * @deprecated – Will be removed in upcoming major version
 */
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export function buildLegacyTones(legacyPalette: LegacyPalette): LegacyTones {
  return {
    state: {
      default: {
        bg: legacyPalette.component.bg,
        fg: legacyPalette.component.fg,
        dark: _isDark(legacyPalette.component.bg, legacyPalette.component.fg),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        default: _buildTints(
          legacyPalette.component.bg,
          legacyPalette.gray.base,
          legacyPalette.component.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        transparent: _buildTints(
          legacyPalette.component.bg,
          legacyPalette.gray.base,
          legacyPalette.component.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        primary: _buildTints(
          legacyPalette.component.bg,
          legacyPalette.state.info.fg,
          legacyPalette.component.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        positive: _buildTints(
          legacyPalette.component.bg,
          legacyPalette.state.success.fg,
          legacyPalette.component.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        caution: _buildTints(
          legacyPalette.component.bg,
          legacyPalette.state.warning.fg,
          legacyPalette.component.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        critical: _buildTints(
          legacyPalette.component.bg,
          legacyPalette.state.danger.fg,
          legacyPalette.component.fg,
        ),
      },
      navbar: {
        bg: legacyPalette.mainNavigation.bg,
        fg: legacyPalette.mainNavigation.fg,
        dark: _isDark(legacyPalette.mainNavigation.bg, legacyPalette.mainNavigation.fg),

        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        default: _buildTints(
          legacyPalette.mainNavigation.bg,
          legacyPalette.gray.base,
          legacyPalette.mainNavigation.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        transparent: _buildTints(
          legacyPalette.mainNavigation.bg,
          legacyPalette.gray.base,
          legacyPalette.mainNavigation.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        primary: _buildTints(
          legacyPalette.mainNavigation.bg,
          legacyPalette.state.info.fg,
          legacyPalette.mainNavigation.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        positive: _buildTints(
          legacyPalette.mainNavigation.bg,
          legacyPalette.state.success.fg,
          legacyPalette.mainNavigation.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        caution: _buildTints(
          legacyPalette.mainNavigation.bg,
          legacyPalette.state.warning.fg,
          legacyPalette.mainNavigation.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        critical: _buildTints(
          legacyPalette.mainNavigation.bg,
          legacyPalette.state.danger.fg,
          legacyPalette.mainNavigation.fg,
        ),
      },
    },
    button: {
      default: {
        bg: legacyPalette.component.bg,
        fg: legacyPalette.component.fg,
        dark: _isDark(legacyPalette.component.bg, legacyPalette.component.fg),

        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        default: _buildTints(
          legacyPalette.component.bg,
          legacyPalette.defaultButton.default.base,
          legacyPalette.component.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        transparent: _buildTints(
          legacyPalette.component.bg,
          legacyPalette.defaultButton.default.base,
          legacyPalette.component.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        primary: _buildTints(
          legacyPalette.component.bg,
          legacyPalette.defaultButton.primary.base,
          legacyPalette.component.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        positive: _buildTints(
          legacyPalette.component.bg,
          legacyPalette.defaultButton.success.base,
          legacyPalette.component.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        caution: _buildTints(
          legacyPalette.component.bg,
          legacyPalette.defaultButton.warning.base,
          legacyPalette.component.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        critical: _buildTints(
          legacyPalette.component.bg,
          legacyPalette.defaultButton.danger.base,
          legacyPalette.component.fg,
        ),
      },
      navbar: {
        bg: legacyPalette.mainNavigation.bg,
        fg: legacyPalette.mainNavigation.fg,
        dark: _isDark(legacyPalette.mainNavigation.bg, legacyPalette.mainNavigation.fg),

        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        default: _buildTints(
          legacyPalette.mainNavigation.bg,
          legacyPalette.defaultButton.default.base,
          legacyPalette.mainNavigation.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        transparent: _buildTints(
          legacyPalette.mainNavigation.bg,
          legacyPalette.defaultButton.default.base,
          legacyPalette.mainNavigation.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        primary: _buildTints(
          legacyPalette.mainNavigation.bg,
          legacyPalette.defaultButton.primary.base,
          legacyPalette.mainNavigation.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        positive: _buildTints(
          legacyPalette.mainNavigation.bg,
          legacyPalette.defaultButton.success.base,
          legacyPalette.mainNavigation.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        caution: _buildTints(
          legacyPalette.mainNavigation.bg,
          legacyPalette.defaultButton.warning.base,
          legacyPalette.mainNavigation.fg,
        ),
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        critical: _buildTints(
          legacyPalette.mainNavigation.bg,
          legacyPalette.defaultButton.danger.base,
          legacyPalette.mainNavigation.fg,
        ),
      },
    },
  }
}
