/* oxlint-disable no-deprecated -- testing deprecated API usage tracking */
import {describe, expect, it} from 'vitest'

import {buildLegacyTheme} from '../theme'

describe('buildLegacyTheme deprecated flags', () => {
  it('tracks --screen-medium-break usage on the theme object', () => {
    const theme = buildLegacyTheme({'--screen-medium-break': '600px'})
    expect(theme.__deprecatedLegacyThemeKeys?.screenMediumBreak).toBe(true)
    expect(theme.__deprecatedLegacyThemeKeys?.screenDefaultBreak).toBe(false)
    expect(theme.__deprecatedLegacyThemeKeys?.screenLargeBreak).toBe(false)
    expect(theme.__deprecatedLegacyThemeKeys?.screenXlargeBreak).toBe(false)
  })

  it('tracks --screen-default-break usage on the theme object', () => {
    const theme = buildLegacyTheme({'--screen-default-break': '768px'})
    expect(theme.__deprecatedLegacyThemeKeys?.screenMediumBreak).toBe(false)
    expect(theme.__deprecatedLegacyThemeKeys?.screenDefaultBreak).toBe(true)
    expect(theme.__deprecatedLegacyThemeKeys?.screenLargeBreak).toBe(false)
    expect(theme.__deprecatedLegacyThemeKeys?.screenXlargeBreak).toBe(false)
  })

  it('tracks --screen-large-break usage on the theme object', () => {
    const theme = buildLegacyTheme({'--screen-large-break': '1024px'})
    expect(theme.__deprecatedLegacyThemeKeys?.screenMediumBreak).toBe(false)
    expect(theme.__deprecatedLegacyThemeKeys?.screenDefaultBreak).toBe(false)
    expect(theme.__deprecatedLegacyThemeKeys?.screenLargeBreak).toBe(true)
    expect(theme.__deprecatedLegacyThemeKeys?.screenXlargeBreak).toBe(false)
  })

  it('tracks --screen-xlarge-break usage on the theme object', () => {
    const theme = buildLegacyTheme({'--screen-xlarge-break': '1400px'})
    expect(theme.__deprecatedLegacyThemeKeys?.screenMediumBreak).toBe(false)
    expect(theme.__deprecatedLegacyThemeKeys?.screenDefaultBreak).toBe(false)
    expect(theme.__deprecatedLegacyThemeKeys?.screenLargeBreak).toBe(false)
    expect(theme.__deprecatedLegacyThemeKeys?.screenXlargeBreak).toBe(true)
  })

  it('tracks multiple --screen-*-break usages on the theme object', () => {
    const theme = buildLegacyTheme({
      '--screen-medium-break': '600px',
      '--screen-xlarge-break': '1400px',
    })
    expect(theme.__deprecatedLegacyThemeKeys?.screenMediumBreak).toBe(true)
    expect(theme.__deprecatedLegacyThemeKeys?.screenDefaultBreak).toBe(false)
    expect(theme.__deprecatedLegacyThemeKeys?.screenLargeBreak).toBe(false)
    expect(theme.__deprecatedLegacyThemeKeys?.screenXlargeBreak).toBe(true)
  })

  it('does not set flags when no --screen-*-break keys are used', () => {
    const theme = buildLegacyTheme({'--brand-primary': '#ff0000'})
    expect(theme.__deprecatedLegacyThemeKeys?.screenMediumBreak).toBe(false)
    expect(theme.__deprecatedLegacyThemeKeys?.screenDefaultBreak).toBe(false)
    expect(theme.__deprecatedLegacyThemeKeys?.screenLargeBreak).toBe(false)
    expect(theme.__deprecatedLegacyThemeKeys?.screenXlargeBreak).toBe(false)
  })

  it('stores flags independently per theme instance (no cross-contamination)', () => {
    const theme1 = buildLegacyTheme({'--screen-medium-break': '600px'})
    const theme2 = buildLegacyTheme({'--screen-large-break': '1024px'})

    // Each theme should have its own flags
    expect(theme1.__deprecatedLegacyThemeKeys?.screenMediumBreak).toBe(true)
    expect(theme1.__deprecatedLegacyThemeKeys?.screenLargeBreak).toBe(false)

    expect(theme2.__deprecatedLegacyThemeKeys?.screenMediumBreak).toBe(false)
    expect(theme2.__deprecatedLegacyThemeKeys?.screenLargeBreak).toBe(true)
  })
})
