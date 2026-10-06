import {useTelemetry} from '@sanity/telemetry/react'
import {useMemo} from 'react'
import {catchError, map, type Observable, of} from 'rxjs'

import {
  UpsellDialogDismissed,
  UpsellDialogLearnMoreCtaClicked,
  UpsellDialogUpgradeCtaClicked,
  UpsellDialogViewed,
  type UpsellDialogViewedInfo,
} from '../studio/upsell/__telemetry__/upsell.telemetry'
import {type UpsellData, type UpsellDataResult} from '../studio/upsell/types'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {interpolateTemplate} from '../util/interpolateTemplate'
import {useClient} from './useClient'
import {useProjectId} from './useProjectId'

interface UpsellDataProps {
  dataUri: string
  feature: string
}

/**
 * The telemetry loggers of an upsell feature's dialog and panel.
 * @internal
 */
export interface UpsellTelemetryLogs {
  dialogSecondaryClicked: () => void
  dialogPrimaryClicked: () => void
  dialogViewed: (source: UpsellDialogViewedInfo['source']) => void
  dialogDismissed: () => void
  panelViewed: (source: UpsellDialogViewedInfo['source']) => void
  panelDismissed: () => void
  panelPrimaryClicked: () => void
  panelSecondaryClicked: () => void
}

/**
 * What a leaf reads where no upsell provider is mounted (its `upsellDataPromise` is `null`):
 * `const {upsellData} = upsellDataPromise ? use(upsellDataPromise) : NO_UPSELL_DATA`.
 *
 * @internal
 */
export const NO_UPSELL_DATA: UpsellDataResult = {upsellData: null, hasError: false}

/**
 * The upsell content for `feature` from `dataUri`, as a stable observable of the settled answer
 * (`upsellData$`), plus the telemetry loggers for the dialog and panel. The observable is cold and
 * never errors: a failed or empty response settles as `hasError`. Turn it into a `use()`-compatible
 * promise with `useObservablePromise(upsellData$)` and start the request with
 * `preloadObservablePromise(upsellData$)` in an effect, so only the leaf that renders the content
 * (an open dialog, an upsell panel) waits for it: the provider neither suspends nor re-renders
 * when the response arrives. `useUpsellContext` does this for the simple providers.
 *
 * @internal
 */
export const useUpsellData = ({
  dataUri,
  feature,
}: UpsellDataProps): {
  upsellData$: Observable<UpsellDataResult>
  telemetryLogs: UpsellTelemetryLogs
} => {
  const telemetry = useTelemetry()
  const projectId = useProjectId()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const isStaging = client.config().apiHost.endsWith('.sanity.work')
  const baseUrl = `https://www.sanity.${isStaging ? 'work' : 'io'}`

  const telemetryLogs = useMemo(
    (): UpsellTelemetryLogs => ({
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

  const upsellData$ = useMemo(
    () =>
      client.observable.request<UpsellData | null>({url: dataUri}).pipe(
        map((data): UpsellDataResult => {
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
        catchError(() => of<UpsellDataResult>({upsellData: null, hasError: true})),
      ),
    [client, projectId, baseUrl, dataUri],
  )

  return {upsellData$, telemetryLogs}
}
