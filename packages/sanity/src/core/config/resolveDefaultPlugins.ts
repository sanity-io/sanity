import {mediaLibrary} from '../../media-library/plugin'
import {canvasIntegration} from '../canvas/canvasIntegrationPlugin'
import {comments} from '../comments-v2/plugin'
import {comments as commentsLegacy} from '../comments/plugin'
import {releases} from '../releases/plugin'
// oxlint-disable-next-line no-restricted-imports
import {scheduledPublishing} from '../scheduled-publishing/plugin'
import {schedules} from '../schedules/plugin'
import {singleDocRelease} from '../singleDocRelease/plugin'
import {tasks} from '../tasks/plugin'
import {variants} from '../variants/plugin'
import {type DefaultPluginsOptions, isDefaultPluginIncluded} from './defaultPluginsOptions'
import {type PluginOptions} from './types'

const defaultPlugins = (options: DefaultPluginsOptions) => [
  variants(),
  options.comments.legacy ? commentsLegacy() : comments(),
  tasks(),
  scheduledPublishing(),
  releases({metadata: options.releases.metadata}),
  canvasIntegration(),
  mediaLibrary(),
  schedules(options),
  singleDocRelease(),
]

export function getDefaultPlugins(options: DefaultPluginsOptions, plugins?: PluginOptions[]) {
  return defaultPlugins(options).filter((plugin) =>
    isDefaultPluginIncluded(plugin.name, options, plugins),
  )
}
