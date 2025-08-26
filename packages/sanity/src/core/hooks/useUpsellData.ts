import {useTelemetry} from '@sanity/telemetry/react'
import {template} from 'lodash'
import {useEffect, useMemo, useState} from 'react'

import {type SourceClientOptions} from '../../core/config/types'
import {
  UpsellDialogDismissed,
  UpsellDialogLearnMoreCtaClicked,
  UpsellDialogUpgradeCtaClicked,
  UpsellDialogViewed,
  type UpsellDialogViewedInfo,
} from '../studio'
import {TEMPLATE_OPTIONS} from '../studio/upsell/constants'
import {type UpsellData} from '../studio/upsell/types'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {useClient, useProjectId} from './'

export interface UpsellDataProps {
  dataUri: string
  feature: string
  ctaBaseUrl?: string
  clientOptions?: SourceClientOptions
}

const BASE_URL = 'www.sanity.io'

const useUpsellData = ({
  ctaBaseUrl = BASE_URL,
  clientOptions,
  dataUri,
  feature,
}: UpsellDataProps) => {
  const [upsellData, setUpsellData] = useState<UpsellData | null>(null)
  const telemetry = useTelemetry()
  const projectId = useProjectId()
  const client = useClient({
    ...DEFAULT_STUDIO_CLIENT_OPTIONS,
    ...clientOptions,
  })

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
        if (!data) return
        try {
          const ctaUrl = template(data.ctaButton.url, TEMPLATE_OPTIONS)
          data.ctaButton.url = ctaUrl({baseUrl: ctaBaseUrl, projectId})

          const secondaryUrl = template(data.secondaryButton.url, TEMPLATE_OPTIONS)
          data.secondaryButton.url = secondaryUrl({baseUrl: ctaBaseUrl, projectId})
          setUpsellData(data)
        } catch (e) {
          // silently fail
        }
      },
      error: () => {
        // silently fail
      },
    })

    return () => {
      sub.unsubscribe()
    }
  }, [client, projectId, ctaBaseUrl, dataUri])

  return {upsellData, telemetryLogs}
}

export default useUpsellData
