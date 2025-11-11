import {useTelemetry} from '@sanity/telemetry/react'
import {useEffect, useMemo, useState} from 'react'

import {
  UpsellDialogDismissed,
  UpsellDialogLearnMoreCtaClicked,
  UpsellDialogUpgradeCtaClicked,
  UpsellDialogViewed,
  type UpsellDialogViewedInfo,
} from '../studio'
import {type UpsellData} from '../studio/upsell/types'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {interpolateTemplate} from '../util/interpolateTemplate'
import {useClient, useProjectId} from './'

interface UpsellDataProps {
  dataUri: string
  feature: string
}

/**
 * Creates a generic fallback upsell data object when the custom upsell data fails to load.
 * This ensures users always see an upsell dialog rather than silently failing.
 * @internal
 */
function createFallbackUpsellData(
  feature: string,
  baseUrl: string,
  projectId: string,
): UpsellData {
  const timestamp = new Date().toISOString()
  return {
    _createdAt: timestamp,
    _id: `fallback-${feature}`,
    _rev: 'fallback',
    _type: 'upsellData',
    _updatedAt: timestamp,
    id: `fallback-${feature}`,
    image: null,
    descriptionText: [
      {
        _key: 'fallback-desc',
        _type: 'block',
        children: [
          {
            _key: 'fallback-text',
            _type: 'span',
            text: 'This feature is available on higher plans. Upgrade your plan to unlock this functionality.',
            marks: [],
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ],
    ctaButton: {
      text: 'Upgrade plan',
      url: `${baseUrl}/manage/project/${projectId}/upgrade`,
    },
    secondaryButton: {
      text: 'Learn more',
      url: `${baseUrl}/pricing`,
    },
  }
}

export const useUpsellData = ({dataUri, feature}: UpsellDataProps) => {
  const [upsellData, setUpsellData] = useState<UpsellData | null>(null)
  const telemetry = useTelemetry()
  const projectId = useProjectId()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const isStaging = client.config().apiHost.endsWith('.sanity.work')
  const baseUrl = `https://www.sanity.${isStaging ? 'work' : 'io'}`

  const telemetryLogs = useMemo(
    () => ({
      dialogSecondaryClicked: () =>
        telemetry.log(UpsellDialogLearnMoreCtaClicked, {
          feature,
          type: 'modal',
        }),
      dialogPrimaryClicked: () =>
        telemetry.log(UpsellDialogUpgradeCtaClicked, {
          feature,
          type: 'modal',
        }),
      dialogViewed: (source: UpsellDialogViewedInfo['source']) =>
        telemetry.log(UpsellDialogViewed, {
          feature,
          type: 'modal',
          source,
        }),
      dialogDismissed: () => {
        telemetry.log(UpsellDialogDismissed, {
          feature,
          type: 'modal',
        })
      },
      panelViewed: (source: UpsellDialogViewedInfo['source']) =>
        telemetry.log(UpsellDialogViewed, {
          feature,
          type: 'inspector',
          source,
        }),
      panelDismissed: () =>
        telemetry.log(UpsellDialogDismissed, {
          feature,
          type: 'inspector',
        }),
      panelPrimaryClicked: () =>
        telemetry.log(UpsellDialogUpgradeCtaClicked, {
          feature,
          type: 'inspector',
        }),
      panelSecondaryClicked: () =>
        telemetry.log(UpsellDialogLearnMoreCtaClicked, {
          feature,
          type: 'inspector',
        }),
    }),
    [telemetry, feature],
  )

  useEffect(() => {
    const data$ = client.observable.request<UpsellData | null>({
      uri: dataUri,
    })

    const sub = data$.subscribe({
      next: (data) => {
        if (!data) {
          // No data returned - use fallback
          setUpsellData(createFallbackUpsellData(feature, baseUrl, projectId))
          return
        }
        try {
          data.ctaButton.url = interpolateTemplate(data.ctaButton.url, {baseUrl, projectId})
          data.secondaryButton.url = interpolateTemplate(data.secondaryButton.url, {
            baseUrl,
            projectId,
          })
          setUpsellData(data)
        } catch (e) {
          // Template interpolation failed - use fallback
          console.error('Failed to parse upsell data:', e)
          setUpsellData(createFallbackUpsellData(feature, baseUrl, projectId))
        }
      },
      error: (err) => {
        // Request failed - use fallback instead of silently failing
        console.error('Failed to fetch upsell data:', err)
        setUpsellData(createFallbackUpsellData(feature, baseUrl, projectId))
      },
    })

    return () => {
      sub.unsubscribe()
    }
  }, [client, projectId, baseUrl, dataUri, feature])

  return {upsellData, telemetryLogs}
}
