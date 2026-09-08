import {MEDIA_LIBRARY_NAME, mediaLibrary} from '../../media-library/plugin'
import {CANVAS_INTEGRATION_NAME, canvasIntegration} from '../canvas/canvasIntegrationPlugin'
import {comments as commentsV2} from '../comments-v2/plugin'
import {comments as commentsCurrent} from '../comments/plugin'
import {releases, RELEASES_NAME} from '../releases/plugin'
// oxlint-disable-next-line no-restricted-imports
import {SCHEDULED_PUBLISHING_NAME, scheduledPublishing} from '../scheduled-publishing/plugin'
import {schedules, SCHEDULES_NAME} from '../schedules/plugin'
import {SINGLE_DOC_RELEASE_NAME, singleDocRelease} from '../singleDocRelease/plugin'
import {tasks, TASKS_NAME} from '../tasks/plugin'
import {variants, VARIANTS_NAME} from '../variants/plugin'
import {
  type AppsOptions,
  type DefaultPluginsWorkspaceOptions,
  type PluginOptions,
  type SingleWorkspace,
  type WorkspaceOptions,
} from './types'

const defaultPlugins = (options: DefaultPluginsOptions) => [
  variants(),
  options.comments.v2 ? commentsV2() : commentsCurrent(),
  tasks(),
  scheduledPublishing(),
  releases(),
  canvasIntegration(),
  mediaLibrary(),
  schedules(options),
  singleDocRelease(),
]

type DefaultPluginsOptions = DefaultPluginsWorkspaceOptions & {
  apps: AppsOptions
}

export function getDefaultPlugins(options: DefaultPluginsOptions, plugins?: PluginOptions[]) {
  return defaultPlugins(options).filter((plugin) => {
    if (plugin.name === VARIANTS_NAME) {
      return options.variants.enabled
    }
    if (plugin.name === SCHEDULED_PUBLISHING_NAME) {
      // The scheduled publishing plugin is only included if other plugin is included by the user.
      return options.scheduledPublishing.enabled && !!plugins?.length
    }
    if (plugin.name === TASKS_NAME) {
      return options.tasks.enabled
    }
    if (plugin.name === RELEASES_NAME) {
      return options.releases.enabled
    }
    if (plugin.name === CANVAS_INTEGRATION_NAME) {
      return options.apps?.canvas?.enabled ?? false
    }
    if (plugin.name === MEDIA_LIBRARY_NAME) {
      return options.mediaLibrary?.enabled
    }
    if (plugin.name === SCHEDULES_NAME) {
      // This tool is shared between releases and single doc release plugins.
      // and it needs to be enabled if either of the plugins are enabled.
      return options.releases.enabled || options.scheduledDrafts?.enabled
    }
    if (plugin.name === SINGLE_DOC_RELEASE_NAME) {
      return options.scheduledDrafts?.enabled
    }
    return true
  })
}

export function getDefaultPluginsOptions(
  workspace: WorkspaceOptions | SingleWorkspace,
): DefaultPluginsOptions {
  return {
    comments: {
      v2: false,
      ...workspace.beta?.comments,
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
    },
    apps: {
      canvas: {
        // By default canvas app is enabled
        enabled: true,
        ...workspace.apps?.canvas,
      },
    },
    mediaLibrary: workspace?.mediaLibrary,
    scheduledDrafts: workspace.scheduledDrafts ?? {enabled: true},
    variants: {
      enabled: false,
      ...workspace.beta?.variants,
    },
  }
}
