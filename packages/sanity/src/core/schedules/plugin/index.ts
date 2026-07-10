import {lazy} from 'react'
import {route} from 'sanity/router'

import {type DefaultPluginsWorkspaceOptions} from '../../config'
import {definePlugin} from '../../config/definePlugin'
import {releasesUsEnglishLocaleBundle} from '../../releases/i18n'
import {RELEASES_INTENT} from '../../releases/plugin'
import {RELEASES_SCHEDULED_DRAFTS_INTENT} from '../../singleDocRelease/plugin'

const ReleasesStudioLayout = lazy(() =>
  import('../../releases/plugin/ReleasesStudioLayout').then((module) => ({
    default: module.ReleasesStudioLayout,
  })),
)
const ReleasesTool = lazy(() =>
  import('../../releases/tool/ReleasesTool').then((module) => ({default: module.ReleasesTool})),
)

/**
 * @internal
 */
export const SCHEDULES_NAME = 'sanity/schedules'

/**
 * @internal
 */
export const SCHEDULES_TOOL_NAME = 'releases'

/**
 * @internal
 */
export const schedules = definePlugin((options: DefaultPluginsWorkspaceOptions) => ({
  name: SCHEDULES_NAME,
  studio: {
    components: {
      layout: ReleasesStudioLayout,
    },
  },
  tools: [
    {
      name: SCHEDULES_TOOL_NAME,
      title: options.releases.enabled ? 'Releases' : 'Scheduled Drafts',
      component: ReleasesTool,
      router: route.create('/', [route.create('/:releaseId')]),
      __internalApplicationType: 'sanity/schedules',
      canHandleIntent: (intent) =>
        Boolean(intent === RELEASES_INTENT || intent === RELEASES_SCHEDULED_DRAFTS_INTENT),
      getIntentState(intent, params) {
        if (intent === RELEASES_INTENT) {
          return {releaseId: params.id}
        }
        if (intent === RELEASES_SCHEDULED_DRAFTS_INTENT) {
          // Handle view parameter and convert to search params
          const searchParams = []
          if (params.view) {
            searchParams.push(['view', params.view])
          }
          return {
            _searchParams: searchParams,
          }
        }
        return null
      },
    },
  ],
  i18n: {
    bundles: [releasesUsEnglishLocaleBundle],
  },
}))
