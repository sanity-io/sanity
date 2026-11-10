import {describe, expect, it} from 'vitest'

import {definePlugin} from '../definePlugin'
import {getDefaultPlugins, getDefaultPluginsOptions} from '../resolveDefaultPlugins'
import {type WorkspaceOptions} from '../types'

const workspace = (overrides: Partial<WorkspaceOptions> = {}): WorkspaceOptions => ({
  name: 'default',
  basePath: '/',
  projectId: 'ppsg7ml5',
  dataset: 'test',
  schema: {types: []},
  ...overrides,
})

const pluginNames = (config: WorkspaceOptions) =>
  getDefaultPlugins(getDefaultPluginsOptions(config), config.plugins).map((plugin) => plugin.name)

describe('getDefaultPlugins', () => {
  it('includes the single-doc release plugin by default', () => {
    expect(pluginNames(workspace())).toContain('sanity/singleDocRelease')
  })

  it('leaves the single-doc release plugin out when a plugin turns scheduled drafts off', () => {
    // The resolved `Source.scheduledDrafts.enabled` is reduced across plugins, and the plugin's own
    // components never re-check the flag, so the gate has to agree with the resolved value
    const disablesScheduledDrafts = definePlugin({
      name: 'disables-scheduled-drafts',
      scheduledDrafts: {enabled: false},
    })
    const names = pluginNames(workspace({plugins: [disablesScheduledDrafts()]}))

    expect(names).not.toContain('sanity/singleDocRelease')
    // The shared schedules tool stays, since releases are still enabled
    expect(names).toContain('sanity/schedules')
  })

  it('lets the root workspace option win over a plugin', () => {
    const disablesScheduledDrafts = definePlugin({
      name: 'disables-scheduled-drafts',
      scheduledDrafts: {enabled: false},
    })
    const names = pluginNames(
      workspace({scheduledDrafts: {enabled: true}, plugins: [disablesScheduledDrafts()]}),
    )

    expect(names).toContain('sanity/singleDocRelease')
  })

  it('leaves the schedules tool out when neither releases nor scheduled drafts are enabled', () => {
    const names = pluginNames(
      workspace({releases: {enabled: false}, scheduledDrafts: {enabled: false}}),
    )

    expect(names).not.toContain('sanity/schedules')
    expect(names).not.toContain('sanity/singleDocRelease')
  })
})
