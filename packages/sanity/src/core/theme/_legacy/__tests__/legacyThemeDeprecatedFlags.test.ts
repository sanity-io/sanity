/* oxlint-disable no-deprecated -- testing deprecated API usage tracking */
import {describe, expect, it, beforeEach} from 'vitest'

import {
  buildLegacyTheme,
  getLegacyThemeDeprecatedFlags,
  _resetLegacyThemeDeprecatedFlags,
} from '../theme'

describe('buildLegacyTheme deprecated flags', () => {
  beforeEach(() => {
    _resetLegacyThemeDeprecatedFlags()
  })

  it('tracks --screen-medium-break usage', () => {
    buildLegacyTheme({'--screen-medium-break': '600px'})
    const flags = getLegacyThemeDeprecatedFlags()
    expect(flags.screenMediumBreak).toBe(true)
    expect(flags.screenDefaultBreak).toBe(false)
    expect(flags.screenLargeBreak).toBe(false)
    expect(flags.screenXlargeBreak).toBe(false)
  })

  it('tracks --screen-default-break usage', () => {
    buildLegacyTheme({'--screen-default-break': '768px'})
    const flags = getLegacyThemeDeprecatedFlags()
    expect(flags.screenMediumBreak).toBe(false)
    expect(flags.screenDefaultBreak).toBe(true)
    expect(flags.screenLargeBreak).toBe(false)
    expect(flags.screenXlargeBreak).toBe(false)
  })

  it('tracks --screen-large-break usage', () => {
    buildLegacyTheme({'--screen-large-break': '1024px'})
    const flags = getLegacyThemeDeprecatedFlags()
    expect(flags.screenMediumBreak).toBe(false)
    expect(flags.screenDefaultBreak).toBe(false)
    expect(flags.screenLargeBreak).toBe(true)
    expect(flags.screenXlargeBreak).toBe(false)
  })

  it('tracks --screen-xlarge-break usage', () => {
    buildLegacyTheme({'--screen-xlarge-break': '1400px'})
    const flags = getLegacyThemeDeprecatedFlags()
    expect(flags.screenMediumBreak).toBe(false)
    expect(flags.screenDefaultBreak).toBe(false)
    expect(flags.screenLargeBreak).toBe(false)
    expect(flags.screenXlargeBreak).toBe(true)
  })

  it('tracks multiple --screen-*-break usages', () => {
    buildLegacyTheme({
      '--screen-medium-break': '600px',
      '--screen-xlarge-break': '1400px',
    })
    const flags = getLegacyThemeDeprecatedFlags()
    expect(flags.screenMediumBreak).toBe(true)
    expect(flags.screenDefaultBreak).toBe(false)
    expect(flags.screenLargeBreak).toBe(false)
    expect(flags.screenXlargeBreak).toBe(true)
  })

  it('does not set flags when no --screen-*-break keys are used', () => {
    buildLegacyTheme({'--brand-primary': '#ff0000'})
    const flags = getLegacyThemeDeprecatedFlags()
    expect(flags.screenMediumBreak).toBe(false)
    expect(flags.screenDefaultBreak).toBe(false)
    expect(flags.screenLargeBreak).toBe(false)
    expect(flags.screenXlargeBreak).toBe(false)
  })

  it('resets flags correctly', () => {
    buildLegacyTheme({'--screen-medium-break': '600px'})
    expect(getLegacyThemeDeprecatedFlags().screenMediumBreak).toBe(true)

    _resetLegacyThemeDeprecatedFlags()
    const flags = getLegacyThemeDeprecatedFlags()
    expect(flags.screenMediumBreak).toBe(false)
    expect(flags.screenDefaultBreak).toBe(false)
    expect(flags.screenLargeBreak).toBe(false)
    expect(flags.screenXlargeBreak).toBe(false)
  })

  it('returns a copy of the flags object', () => {
    buildLegacyTheme({'--screen-medium-break': '600px'})
    const flags1 = getLegacyThemeDeprecatedFlags()
    const flags2 = getLegacyThemeDeprecatedFlags()
    expect(flags1).toEqual(flags2)
    expect(flags1).not.toBe(flags2)
  })
})
