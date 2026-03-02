import {route} from 'sanity/router'

import {definePlugin} from '../../config/definePlugin'
import {releasesUsEnglishLocaleBundle} from '../../releases/i18n'
import {RELEASES_INTENT} from '../../releases/plugin'
import {ReleasesStudioLayout} from '../../releases/plugin/ReleasesStudioLayout'
import {ReleasesTool} from '../../releases/tool/ReleasesTool'
import {RELEASES_SCHEDULED_DRAFTS_INTENT} from '../../singleDocRelease/plugin'
import {useWorkspace} from '../../studio'

/**
 * @internal
 */
export const SCHEDULES_NAME = 'sanity/schedules'

/**
 * @internal
 */
export const SCHEDULES_TOOL_NAME = 'releases'

const ToolTitle = () => {
  const isReleasesEnabled = useWorkspace().releases?.enabled
  return <div>{isReleasesEnabled ? 'Releases' : 'Scheduled Drafts'}</div>
}

/**
 * @internal
 */
export const schedules = definePlugin({
  name: SCHEDULES_NAME,
  studio: {
    components: {
      layout: ReleasesStudioLayout,
    },
  },
  tools: [
    {
      name: SCHEDULES_TOOL_NAME,
      // @ts-expect-error - title expects a string, but it will render the Component.
      title: <ToolTitle />,
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
})
