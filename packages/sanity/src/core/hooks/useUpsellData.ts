import {useTelemetry} from '@sanity/telemetry/react'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'

import {
  UpsellDialogDismissed,
  UpsellDialogLearnMoreCtaClicked,
  UpsellDialogUpgradeCtaClicked,
  UpsellDialogViewed,
  type UpsellDialogViewedInfo,
} from '../studio/upsell/__telemetry__/upsell.telemetry'
import {type UpsellData} from '../studio/upsell/types'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {interpolateTemplate} from '../util/interpolateTemplate'
import {useClient} from './useClient'
import {useProjectId} from './useProjectId'

interface UpsellDataProps {
  dataUri: string
  feature: string
}

type UpsellResult = {upsellData: UpsellData | null; hasError: boolean}

const INITIAL_UPSELL_RESULT: UpsellResult = {upsellData: null, hasError: false}

export const useUpsellData = ({dataUri, feature}: UpsellDataProps) => {
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

  const upsellResult$ = useMemo(
    () =>
      client.observable.request<UpsellData | null>({uri: dataUri}).pipe(
        map((data): UpsellResult => {
          if (!data) {
            return {upsellData: null, hasError: true}
          }
          try {
            data.ctaButton.url = interpolateTemplate(data.ctaButton.url, {baseUrl, projectId})
            data.secondaryButton.url = interpolateTemplate(data.secondaryButton.url, {
              baseUrl,
              projectId,
            })
            return {upsellData: data, hasError: false}
          } catch {
            return {upsellData: null, hasError: true}
          }
        }),
        catchError(() => of({upsellData: null, hasError: true})),
      ),
    [client, projectId, baseUrl, dataUri],
  )

  const {upsellData, hasError} = useObservable(upsellResult$, INITIAL_UPSELL_RESULT)

  return {upsellData, telemetryLogs, hasError}
}
