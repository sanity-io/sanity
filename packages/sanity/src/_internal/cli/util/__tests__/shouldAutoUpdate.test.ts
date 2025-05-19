import {type CliConfig} from '@sanity/cli'
import {describe, expect, it, vi} from 'vitest'

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

  it('should show a deprecation warning when flags["auto-updates"] is used', () => {
    const mockOutput = {warn: vi.fn()}

    shouldAutoUpdate({flags: {'auto-updates': true}, output: mockOutput})
    expect(mockOutput.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'The --auto-updates flag is deprecated. Set the `autoUpdates` option in the `sanity.cli` instead.',
      ),
    )

    mockOutput.warn.mockReset()

    shouldAutoUpdate({flags: {'auto-updates': false}, output: mockOutput})
    expect(mockOutput.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'The --auto-updates flag is deprecated. Set the `autoUpdates` option in the `sanity.cli` instead.',
      ),
    )
  })

  it('should not show a deprecation warning when the flag is not used', () => {
    const mockOutput = {warn: vi.fn()}

    shouldAutoUpdate({flags: {}, cliConfig: {autoUpdates: true}, output: mockOutput})
    expect(mockOutput.warn).not.toHaveBeenCalled()
  })
})
