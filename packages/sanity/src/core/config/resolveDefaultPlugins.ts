import {MEDIA_LIBRARY_NAME, mediaLibrary} from '../../media-library/plugin'
import {CANVAS_INTEGRATION_NAME, canvasIntegration} from '../canvas/canvasIntegrationPlugin'
import {comments} from '../comments/plugin'
import {createIntegration} from '../create/createIntegrationPlugin'
import {releases, RELEASES_NAME} from '../releases/plugin'
// eslint-disable-next-line no-restricted-imports
import {SCHEDULED_PUBLISHING_NAME, scheduledPublishing} from '../scheduled-publishing/plugin'
import {tasks, TASKS_NAME} from '../tasks/plugin'
import {
  type AppsOptions,
  type DefaultPluginsWorkspaceOptions,
  type PluginOptions,
  type SingleWorkspace,
  type WorkspaceOptions,
} from './types'

const defaultPlugins = [
  comments(),
  tasks(),
  scheduledPublishing(),
  createIntegration(),
  releases(),
  canvasIntegration(),
  mediaLibrary(),
]

type DefaultPluginsOptions = DefaultPluginsWorkspaceOptions & {
  apps: AppsOptions
}

export function getDefaultPlugins(options: DefaultPluginsOptions, plugins?: PluginOptions[]) {
  return defaultPlugins.filter((plugin) => {
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
    return true
  })
}

export function getDefaultPluginsOptions(
  workspace: WorkspaceOptions | SingleWorkspace,
): DefaultPluginsOptions {
  return {
    tasks: {
      enabled: true,
      ...workspace.unstable_tasks,
      ...workspace.tasks,
    },
    scheduledPublishing: {
      enabled: true,
      // 25/12/2022 22:00
      inputDateTimeFormat: 'dd/MM/yyyy HH:mm',
      showReleasesBanner: true,
      ...workspace.scheduledPublishing,
      // If the user has explicitly enabled scheduled publishing, we should respect that
      // eslint-disable-next-line camelcase
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
  }
}
