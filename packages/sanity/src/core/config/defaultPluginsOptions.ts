import {mediaLibraryUsEnglishLocaleBundle} from '../../media-library/plugin/i18n'
import {canvasUsEnglishLocaleBundle} from '../canvas/i18n'
import {commentsUsEnglishLocaleBundle as commentsV2UsEnglishLocaleBundle} from '../comments-v2/i18n'
import {commentsUsEnglishLocaleBundle} from '../comments/i18n'
import {type LocaleResourceBundle} from '../i18n/types'
import {releasesUsEnglishLocaleBundle} from '../releases/i18n'
import {singleDocReleaseUsEnglishLocaleBundle} from '../singleDocRelease/i18n'
import {tasksUsEnglishLocaleBundle} from '../tasks/i18n'
import {getPrintableType} from '../util/getPrintableType'
import {variantsUsEnglishLocaleBundle} from '../variants/i18n'
import {scheduledDraftsEnabledReducer} from './configPropertyReducers'
import {resolveReleaseMetadataConfig} from './releases/metadataFields'
import {
  type AppsOptions,
  type DefaultPluginsWorkspaceOptions,
  type PluginOptions,
  type SingleWorkspace,
  type WorkspaceOptions,
} from './types'

/** @internal */
export type DefaultPluginsOptions = DefaultPluginsWorkspaceOptions & {
  apps: AppsOptions
}

/**
 * The locale bundles of the default plugins, by plugin name and in the order
 * `getDefaultPlugins` adds the plugins. The login screen renders before the
 * plugins themselves load, and it translates with the i18n instance prepared
 * from these, so they must match the plugins' own `i18n.bundles`
 * (`resolveDefaultPlugins.test.ts` checks that they do).
 */
function getDefaultPluginsLocaleBundles(
  options: DefaultPluginsOptions,
): Array<{name: string; bundles: LocaleResourceBundle[]}> {
  return [
    {name: 'sanity/variants', bundles: [variantsUsEnglishLocaleBundle]},
    {
      name: 'sanity/comments',
      bundles: [
        options.comments.legacy ? commentsUsEnglishLocaleBundle : commentsV2UsEnglishLocaleBundle,
      ],
    },
    {name: 'sanity/tasks', bundles: [tasksUsEnglishLocaleBundle]},
    {name: 'sanity/scheduled-publishing', bundles: []},
    {name: 'sanity/releases', bundles: []},
    {name: 'sanity/canvas-integration', bundles: [canvasUsEnglishLocaleBundle]},
    {name: 'sanity/media-library', bundles: [mediaLibraryUsEnglishLocaleBundle]},
    {name: 'sanity/schedules', bundles: [releasesUsEnglishLocaleBundle]},
    {name: 'sanity/singleDocRelease', bundles: [singleDocReleaseUsEnglishLocaleBundle]},
  ]
}

/**
 * Whether `getDefaultPlugins` includes the default plugin with the given name.
 *
 * @internal
 */
export function isDefaultPluginIncluded(
  name: string,
  options: DefaultPluginsOptions,
  plugins: PluginOptions[] | undefined,
): boolean {
  switch (name) {
    case 'sanity/variants':
      return options.variants.enabled
    case 'sanity/scheduled-publishing':
      // The scheduled publishing plugin is only included if other plugin is included by the user.
      return options.scheduledPublishing.enabled && !!plugins?.length
    case 'sanity/tasks':
      return options.tasks.enabled
    case 'sanity/releases':
      return !!options.releases.enabled
    case 'sanity/canvas-integration':
      return options.apps?.canvas?.enabled ?? false
    case 'sanity/media-library':
      return !!options.mediaLibrary?.enabled
    case 'sanity/schedules':
      // This tool is shared between releases and single doc release plugins.
      // and it needs to be enabled if either of the plugins are enabled.
      return !!options.releases.enabled || !!options.scheduledDrafts?.enabled
    case 'sanity/singleDocRelease':
      return !!options.scheduledDrafts?.enabled
    default:
      return true
  }
}

/**
 * Plugins carrying only the locale bundles of the default plugins that
 * `getDefaultPlugins` includes, so the i18n instance can be prepared before
 * the plugins themselves are loaded.
 *
 * @internal
 */
export function getDefaultPluginsLocalePlugins(
  options: DefaultPluginsOptions,
  plugins: PluginOptions[] | undefined,
): PluginOptions[] {
  return getDefaultPluginsLocaleBundles(options)
    .filter(({name}) => isDefaultPluginIncluded(name, options, plugins))
    .map(({name, bundles}) => ({name, i18n: {bundles}}))
}

function resolveCommentsLegacy(workspace: WorkspaceOptions | SingleWorkspace): boolean {
  const legacy = workspace.comments?.legacy

  if (typeof legacy === 'undefined') {
    return false
  }

  if (typeof legacy === 'boolean') {
    return legacy
  }

  throw new Error(
    `Expected \`comments.legacy\` to be a boolean, but received ${getPrintableType(legacy)}`,
  )
}

/** @internal */
export function getDefaultPluginsOptions(
  workspace: WorkspaceOptions | SingleWorkspace,
): DefaultPluginsOptions {
  return {
    comments: {
      legacy: resolveCommentsLegacy(workspace),
    },
    tasks: {
      enabled: true,
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      ...workspace.unstable_tasks,
      ...workspace.tasks,
    },
    scheduledPublishing: {
      enabled: true,
      // 25/12/2022 22:00
      inputDateTimeFormat: 'dd/MM/yyyy HH:mm',
      ...workspace.scheduledPublishing,
      // If the user has explicitly enabled scheduled publishing, we should respect that
      __internal__workspaceEnabled: workspace.scheduledPublishing?.enabled ?? false,
    },
    releases: {
      ...workspace.releases,
      enabled: workspace.releases?.enabled ?? true,
      // Reduced across the workspace's plugins, so the releases plugin adds the same metadata
      // to the schema as the resolved `Source.releases.metadata` describes
      metadata: resolveReleaseMetadataConfig(workspace as PluginOptions),
    },
    apps: {
      canvas: {
        // By default canvas app is enabled
        enabled: true,
        ...workspace.apps?.canvas,
      },
    },
    mediaLibrary: workspace?.mediaLibrary,
    scheduledDrafts: {
      ...workspace.scheduledDrafts,
      // Reduced across the workspace's plugins, like the resolved `Source.scheduledDrafts.enabled`
      // (the root's own value wins), so a plugin that turns scheduled drafts off also leaves the
      // single-doc release plugin out and the plugin never has to re-check the flag itself
      enabled: scheduledDraftsEnabledReducer({
        config: workspace as PluginOptions,
        initialValue: true,
      }),
    },
    variants: {
      enabled: false,
      ...workspace.beta?.variants,
    },
  }
}
