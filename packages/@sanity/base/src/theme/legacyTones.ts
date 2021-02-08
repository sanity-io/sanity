import {_buildTints, _isDark} from './helpers'
import {legacyPalette} from './legacyPalette'

export const legacyTones = {
  state: {
    default: {
      bg: legacyPalette.component.bg,
      fg: legacyPalette.component.fg,
      dark: _isDark(legacyPalette.component.bg, legacyPalette.component.fg),
      default: _buildTints(
        legacyPalette.component.bg,
        legacyPalette.gray.base,
        legacyPalette.component.fg
      ),
      primary: _buildTints(
        legacyPalette.component.bg,
        legacyPalette.state.info.fg,
        legacyPalette.component.fg
      ),
      positive: _buildTints(
        legacyPalette.component.bg,
        legacyPalette.state.success.fg,
        legacyPalette.component.fg
      ),
      caution: _buildTints(
        legacyPalette.component.bg,
        legacyPalette.state.warning.fg,
        legacyPalette.component.fg
      ),
      critical: _buildTints(
        legacyPalette.component.bg,
        legacyPalette.state.danger.fg,
        legacyPalette.component.fg
      ),
    },
    navbar: {
      bg: legacyPalette.mainNavigation.bg,
      fg: legacyPalette.mainNavigation.fg,
      dark: _isDark(legacyPalette.mainNavigation.bg, legacyPalette.mainNavigation.fg),

      default: _buildTints(
        legacyPalette.mainNavigation.bg,
        legacyPalette.gray.base,
        legacyPalette.mainNavigation.fg
      ),
      primary: _buildTints(
        legacyPalette.mainNavigation.bg,
        legacyPalette.state.info.fg,
        legacyPalette.mainNavigation.fg
      ),
      positive: _buildTints(
        legacyPalette.mainNavigation.bg,
        legacyPalette.state.success.fg,
        legacyPalette.mainNavigation.fg
      ),
      caution: _buildTints(
        legacyPalette.mainNavigation.bg,
        legacyPalette.state.warning.fg,
        legacyPalette.mainNavigation.fg
      ),
      critical: _buildTints(
        legacyPalette.mainNavigation.bg,
        legacyPalette.state.danger.fg,
        legacyPalette.mainNavigation.fg
      ),
    },
  },
  button: {
    default: {
      bg: legacyPalette.component.bg,
      fg: legacyPalette.component.fg,
      dark: _isDark(legacyPalette.component.bg, legacyPalette.component.fg),

      default: _buildTints(
        legacyPalette.component.bg,
        legacyPalette.defaultButton.default.base,
        legacyPalette.component.fg
      ),
      primary: _buildTints(
        legacyPalette.component.bg,
        legacyPalette.defaultButton.primary.base,
        legacyPalette.component.fg
      ),
      positive: _buildTints(
        legacyPalette.component.bg,
        legacyPalette.defaultButton.success.base,
        legacyPalette.component.fg
      ),
      caution: _buildTints(
        legacyPalette.component.bg,
        legacyPalette.defaultButton.warning.base,
        legacyPalette.component.fg
      ),
      critical: _buildTints(
        legacyPalette.component.bg,
        legacyPalette.defaultButton.danger.base,
        legacyPalette.component.fg
      ),
    },
    navbar: {
      bg: legacyPalette.mainNavigation.bg,
      fg: legacyPalette.mainNavigation.fg,
      dark: _isDark(legacyPalette.mainNavigation.bg, legacyPalette.mainNavigation.fg),

      default: _buildTints(
        legacyPalette.mainNavigation.bg,
        legacyPalette.defaultButton.default.base,
        legacyPalette.mainNavigation.fg
      ),
      primary: _buildTints(
        legacyPalette.mainNavigation.bg,
        legacyPalette.defaultButton.primary.base,
        legacyPalette.mainNavigation.fg
      ),
      positive: _buildTints(
        legacyPalette.mainNavigation.bg,
        legacyPalette.defaultButton.success.base,
        legacyPalette.mainNavigation.fg
      ),
      caution: _buildTints(
        legacyPalette.mainNavigation.bg,
        legacyPalette.defaultButton.warning.base,
        legacyPalette.mainNavigation.fg
      ),
      critical: _buildTints(
        legacyPalette.mainNavigation.bg,
        legacyPalette.defaultButton.danger.base,
        legacyPalette.mainNavigation.fg
      ),
    },
  },
}
