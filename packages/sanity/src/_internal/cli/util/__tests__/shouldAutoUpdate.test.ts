import {describe, expect, it} from '@jest/globals'
import {type CliConfig} from '@sanity/cli'

import {type BuildSanityStudioCommandFlags} from '../../actions/build/buildAction'
import {shouldAutoUpdate} from '../shouldAutoUpdate'

describe('shouldAutoUpdate', () => {
  it('should return true when flags["auto-updates"] is true', () => {
    const flags: BuildSanityStudioCommandFlags = {'auto-updates': true}
    expect(shouldAutoUpdate({flags})).toBe(true)
  })

  it('should return false when flags["auto-updates"] is false', () => {
    const flags: BuildSanityStudioCommandFlags = {'auto-updates': false}
    expect(shouldAutoUpdate({flags})).toBe(false)
  })

  it('should return true when cliConfig.autoUpdates is true and flags["auto-updates"] is not set', () => {
    const flags: BuildSanityStudioCommandFlags = {}
    const cliConfig: CliConfig = {autoUpdates: true}
    expect(shouldAutoUpdate({flags, cliConfig})).toBe(true)
  })

  it('should return false when cliConfig.autoUpdates is false and flags["auto-updates"] is not set', () => {
    const flags: BuildSanityStudioCommandFlags = {}
    const cliConfig: CliConfig = {autoUpdates: false}
    expect(shouldAutoUpdate({flags, cliConfig})).toBe(false)
  })

  it('should return false when both flags["auto-updates"] and cliConfig.autoUpdates are not set', () => {
    const flags: BuildSanityStudioCommandFlags = {}
    expect(shouldAutoUpdate({flags})).toBe(false)
  })

  it('should prioritize flags over cliConfig when both are set', () => {
    const flags: BuildSanityStudioCommandFlags = {'auto-updates': false}
    const cliConfig: CliConfig = {autoUpdates: true}
    expect(shouldAutoUpdate({flags, cliConfig})).toBe(false)
  })
})
