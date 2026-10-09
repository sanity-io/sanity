import {lazy} from 'react'
import {route} from 'sanity/router'

import {definePlugin} from '../../config/definePlugin'
import {type ProviderProps} from '../../config/studio/types'
import {type DefaultPluginsWorkspaceOptions} from '../../config/types'
import {ReleasesMetadataProvider} from '../../releases/contexts/ReleasesMetadataProvider'
import {ReleasesUpsellProvider} from '../../releases/contexts/upsell/ReleasesUpsellProvider'
import {releasesUsEnglishLocaleBundle} from '../../releases/i18n'
import {RELEASES_INTENT} from '../../releases/plugin'
import {RELEASES_SCHEDULED_DRAFTS_INTENT} from '../../singleDocRelease/plugin'
import {SCHEDULES_NAME, SCHEDULES_TOOL_NAME} from '../constants'
import {useReleasesToolAvailable} from '../hooks/useReleasesToolAvailable'

const ReleasesTool = lazy(() => import('../../releases/tool/ReleasesTool'))

export {SCHEDULES_NAME, SCHEDULES_TOOL_NAME} from '../constants'

/**
 * @internal
 */
export const schedules = definePlugin((options: DefaultPluginsWorkspaceOptions) => ({
  name: SCHEDULES_NAME,
  studio: {
    components: {
      provider: ReleasesStudioProvider,
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

/**
 * The releases providers for the whole studio. Only mounted when the releases tool is in the
 * workspace: releases can be enabled while the tool was filtered out, and then nothing needs them.
 */
function ReleasesStudioProvider(props: ProviderProps) {
  const releasesToolAvailable = useReleasesToolAvailable()

  if (!releasesToolAvailable) {
    return props.renderDefault(props)
  }

  return (
    <ReleasesUpsellProvider>
      <ReleasesMetadataProvider>{props.renderDefault(props)}</ReleasesMetadataProvider>
    </ReleasesUpsellProvider>
  )
}
