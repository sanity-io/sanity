import {describe, expect, it} from 'vitest'

import {commentsInspector} from '../../comments-v2/plugin/inspector'
import {commentsInspector as commentsLegacyInspector} from '../../comments/plugin/inspector'
import {localeBundlesReducer} from '../configPropertyReducers'
import {getDefaultPluginsLocalePlugins, getDefaultPluginsOptions} from '../defaultPluginsOptions'
import {definePlugin} from '../definePlugin'
import {resolveConfigProperty} from '../resolveConfigProperty'
import {getDefaultPlugins} from '../resolveDefaultPlugins'
import {type PluginOptions, type WorkspaceOptions} from '../types'

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

function commentsPluginInspector(config: WorkspaceOptions) {
  const plugins = getDefaultPlugins(getDefaultPluginsOptions(config), config.plugins)
  const inspectors = plugins.find((plugin) => plugin.name === 'sanity/comments')?.document
    ?.inspectors

  return Array.isArray(inspectors) ? inspectors[0] : undefined
}

describe('getDefaultPlugins', () => {
  it('registers the comments plugin by default', () => {
    expect(commentsPluginInspector(workspace())).toBe(commentsInspector)
  })

  it('registers the legacy addon comments plugin when comments.legacy is true', () => {
    expect(commentsPluginInspector(workspace({comments: {legacy: true}}))).toBe(
      commentsLegacyInspector,
    )
  })

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

  it('leaves the tasks plugin out when tasks.enabled is false', () => {
    expect(pluginNames(workspace())).toContain('sanity/tasks')
    expect(pluginNames(workspace({tasks: {enabled: false}}))).not.toContain('sanity/tasks')
  })

  it('throws when the removed unstable_tasks option is still configured', () => {
    const legacyConfig = workspace({unstable_tasks: {enabled: false}} as Partial<WorkspaceOptions>)

    expect(() => getDefaultPluginsOptions(legacyConfig)).toThrow(
      'The `unstable_tasks` option has been removed. Use `tasks` instead.',
    )
  })
})

function localeBundles(config: WorkspaceOptions, plugins: PluginOptions[]) {
  return resolveConfigProperty({
    config: {...config, plugins},
    context: {projectId: config.projectId, dataset: config.dataset},
    propertyName: 'i18n.bundles',
    reducer: localeBundlesReducer,
    initialValue: [],
  })
}

describe('getDefaultPluginsLocalePlugins', () => {
  const userPlugin = definePlugin({name: 'user-plugin'})

  it.each([
    ['the default options', workspace()],
    ['user plugins', workspace({plugins: [userPlugin()]})],
    ['legacy comments', workspace({comments: {legacy: true}})],
    [
      'variants and the media library',
      workspace({beta: {variants: {enabled: true}}, mediaLibrary: {enabled: true}}),
    ],
    [
      'every optional default plugin turned off',
      workspace({
        tasks: {enabled: false},
        releases: {enabled: false},
        scheduledDrafts: {enabled: false},
        scheduledPublishing: {enabled: false},
        apps: {canvas: {enabled: false}},
      }),
    ],
  ])('adds the locale bundles of the default plugins included with %s', (_, config) => {
    const options = getDefaultPluginsOptions(config)
    const plugins = getDefaultPlugins(options, config.plugins)
    const localePlugins = getDefaultPluginsLocalePlugins(options, config.plugins)

    expect(localePlugins.map((plugin) => plugin.name)).toEqual(plugins.map((plugin) => plugin.name))
    expect(localeBundles(config, localePlugins)).toEqual(localeBundles(config, plugins))
  })
})
