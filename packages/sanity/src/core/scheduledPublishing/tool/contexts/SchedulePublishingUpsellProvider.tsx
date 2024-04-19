import {useTelemetry} from '@sanity/telemetry/react'
import {template} from 'lodash'
import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  UpsellDialogDismissed,
  UpsellDialogLearnMoreCtaClicked,
  UpsellDialogUpgradeCtaClicked,
  UpsellDialogViewed,
  type UpsellDialogViewedInfo,
  useClient,
  useProjectId,
} from 'sanity'

import {type UpsellData} from '../../../studio/upsell/types'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'

export interface SchedulePublishUpsellContextValue {
  upsellDialogOpen: boolean
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  upsellData: UpsellData | null
  telemetryLogs: {
    dialogSecondaryClicked: () => void
    dialogPrimaryClicked: () => void
    panelViewed: (source: UpsellDialogViewedInfo['source']) => void
    panelDismissed: () => void
    panelPrimaryClicked: () => void
    panelSecondaryClicked: () => void
  }
}

/**
 * @beta
 * @hidden
 */
export const SchedulePublishUpsellContext = createContext<SchedulePublishUpsellContextValue>({
  upsellData: null,
  handleOpenDialog: () => null,
  upsellDialogOpen: false,
  telemetryLogs: {
    dialogSecondaryClicked: () => null,
    dialogPrimaryClicked: () => null,
    panelViewed: () => null,
    panelDismissed: () => null,
    panelPrimaryClicked: () => null,
    panelSecondaryClicked: () => null,
  },
})

const FEATURE = 'scheduled_publishing' as const
const TEMPLATE_OPTIONS = {interpolate: /{{([\s\S]+?)}}/g}
const BASE_URL = 'www.sanity.io'

/**
 * @beta
 * @hidden
 */
export function SchedulePublishingUpsellProvider(props: {children: React.ReactNode}) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const [upsellData, setUpsellData] = useState<UpsellData | null>(null)
  const projectId = useProjectId()
  const telemetry = useTelemetry()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const telemetryLogs = useMemo(
    (): SchedulePublishUpsellContextValue['telemetryLogs'] => ({
      dialogSecondaryClicked: () =>
        telemetry.log(UpsellDialogLearnMoreCtaClicked, {
          feature: FEATURE,
          type: 'modal',
        }),
      dialogPrimaryClicked: () =>
        telemetry.log(UpsellDialogUpgradeCtaClicked, {
          feature: FEATURE,
          type: 'modal',
        }),
      panelViewed: (source) =>
        telemetry.log(UpsellDialogViewed, {
          feature: FEATURE,
          type: 'inspector',
          source,
        }),
      panelDismissed: () =>
        telemetry.log(UpsellDialogDismissed, {
          feature: FEATURE,
          type: 'inspector',
        }),
      panelPrimaryClicked: () =>
        telemetry.log(UpsellDialogUpgradeCtaClicked, {
          feature: FEATURE,
          type: 'inspector',
        }),
      panelSecondaryClicked: () =>
        telemetry.log(UpsellDialogLearnMoreCtaClicked, {
          feature: FEATURE,
          type: 'inspector',
        }),
    }),
    [telemetry],
  )

  const handlePrimaryButtonClick = useCallback(() => {
    telemetryLogs.dialogPrimaryClicked()
  }, [telemetryLogs])

  const handleSecondaryButtonClick = useCallback(() => {
    telemetryLogs.dialogSecondaryClicked()
  }, [telemetryLogs])

  const handleClose = useCallback(() => {
    setUpsellDialogOpen(false)
    telemetry.log(UpsellDialogDismissed, {
      feature: FEATURE,
      type: 'modal',
    })
  }, [telemetry])

  useEffect(() => {
    const data$ = client.observable.request<UpsellData | null>({
      uri: '/journey/scheduled-publishing',
    })

    const sub = data$.subscribe({
      next: (data) => {
        if (!data) return
        try {
          const ctaUrl = template(data.ctaButton.url, TEMPLATE_OPTIONS)
          data.ctaButton.url = ctaUrl({baseUrl: BASE_URL, projectId})

          const secondaryUrl = template(data.secondaryButton.url, TEMPLATE_OPTIONS)
          data.secondaryButton.url = secondaryUrl({baseUrl: BASE_URL, projectId})
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
  }, [client, projectId])

  const handleOpenDialog = useCallback(
    (source: UpsellDialogViewedInfo['source']) => {
      setUpsellDialogOpen(true)

      telemetry.log(UpsellDialogViewed, {
        feature: FEATURE,
        type: 'modal',
        source,
      })
    },
    [telemetry],
  )

  const ctxValue = useMemo<SchedulePublishUpsellContextValue>(
    () => ({
      upsellDialogOpen,
      handleOpenDialog,
      upsellData,
      telemetryLogs,
    }),
    [handleOpenDialog, upsellDialogOpen, upsellData, telemetryLogs],
  )

  return (
    <SchedulePublishUpsellContext.Provider value={ctxValue}>
      {props.children}
      {upsellData && upsellDialogOpen && (
        <UpsellDialog
          data={upsellData}
          onClose={handleClose}
          onPrimaryClick={handlePrimaryButtonClick}
          onSecondaryClick={handleSecondaryButtonClick}
        />
      )}
    </SchedulePublishUpsellContext.Provider>
  )
}

export function useSchedulePublishingUpsell(): SchedulePublishUpsellContextValue {
  const context = useContext(SchedulePublishUpsellContext)
  return context
}
