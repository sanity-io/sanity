import {ColorTintKey} from '@sanity/color'

/** @internal */
// eslint-disable-next-line no-unused-vars
export type LegacyThemeTints = {[key in ColorTintKey]: string}

/**
 * @public
 *
 * Properties that can be used to override the default theme.
 */
export interface LegacyThemeProps {
  '--font-family-monospace': string
  '--font-family-base': string

  '--black': string
  '--white': string

  '--brand-primary': string

  '--component-bg': string
  '--component-text-color': string

  '--default-button-color': string
  '--default-button-primary-color': string
  '--default-button-success-color': string
  '--default-button-warning-color': string
  '--default-button-danger-color': string

  '--focus-color': string

  '--gray-base': string
  '--gray': string

  '--main-navigation-color': string
  '--main-navigation-color--inverted': string

  '--state-info-color': string
  '--state-success-color': string
  '--state-warning-color': string
  '--state-danger-color': string

  '--screen-medium-break': string
  '--screen-default-break': string
  '--screen-large-break': string
  '--screen-xlarge-break': string
}
