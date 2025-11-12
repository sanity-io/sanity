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

export const useUpsellData = ({dataUri, feature}: UpsellDataProps) => {
  const [upsellData, setUpsellData] = useState<UpsellData | null>(null)
  const [hasError, setHasError] = useState(false)
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
          setHasError(true)
          setUpsellData(null)
          return
        }
        try {
          data.ctaButton.url = interpolateTemplate(data.ctaButton.url, {baseUrl, projectId})
          data.secondaryButton.url = interpolateTemplate(data.secondaryButton.url, {
            baseUrl,
            projectId,
          })
          setUpsellData(data)
          setHasError(false)
        } catch (e) {
          setHasError(true)
          setUpsellData(null)
        }
      },
      error: (err) => {
        setHasError(true)
        setUpsellData(null)
      },
    })

    return () => {
      sub.unsubscribe()
    }
  }, [client, projectId, baseUrl, dataUri])

  return {upsellData, telemetryLogs, hasError}
}
