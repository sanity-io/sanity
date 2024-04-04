import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo, useState} from 'react'
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

import {CommentsUpsellDialog, type UpsellData} from '../../../../../structure/comments'
import {TASKS_UPSELL_MOCK} from './__MOCK__'
import {TasksUpsellContext} from './TasksUpsellContext'
import {type TasksUpsellContextValue} from './types'

const FEATURE = 'tasks'
const TEMPLATE_OPTIONS = {interpolate: /{{([\s\S]+?)}}/g}
const BASE_URL = 'www.sanity.io'

/**
 * @beta
 * @hidden
 */
export function TasksUpsellProvider(props: {children: React.ReactNode}) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  // TODO: Change for real data once the endpoint is ready
  const [upsellData, setUpsellData] = useState<UpsellData | null>(TASKS_UPSELL_MOCK)
  const projectId = useProjectId()
  const telemetry = useTelemetry()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const telemetryLogs = useMemo(
    (): TasksUpsellContextValue['telemetryLogs'] => ({
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

  // TODO: Uncomment when the endpoint is ready
  // useEffect(() => {
  //   const data$ = client
  //     .observable.request<TasksUpsellData | null>({
  //       uri: '/journey/tasks',
  //     })

  //   const sub = data$.subscribe({
  //     next: (data) => {
  //       if (!data) return
  //       try {
  //         const ctaUrl = template(data.ctaButton.url, TEMPLATE_OPTIONS)
  //         data.ctaButton.url = ctaUrl({baseUrl: BASE_URL, projectId})

  //         const secondaryUrl = template(data.secondaryButton.url, TEMPLATE_OPTIONS)
  //         data.secondaryButton.url = secondaryUrl({baseUrl: BASE_URL, projectId})
  //         setUpsellData(data)
  //       } catch (e) {
  //         // silently fail
  //       }
  //     },
  //     error: () => {
  //       // silently fail
  //     },
  //   })

  //   return () => {
  //     sub.unsubscribe()
  //   }
  // }, [client, projectId])

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

  const ctxValue = useMemo<TasksUpsellContextValue>(
    () => ({
      upsellDialogOpen,
      handleOpenDialog,
      upsellData,
      telemetryLogs,
    }),
    [handleOpenDialog, upsellDialogOpen, upsellData, telemetryLogs],
  )

  return (
    <TasksUpsellContext.Provider value={ctxValue}>
      {props.children}
      {upsellData && upsellDialogOpen && (
        <CommentsUpsellDialog
          data={upsellData}
          onClose={handleClose}
          onPrimaryClick={handlePrimaryButtonClick}
          onSecondaryClick={handleSecondaryButtonClick}
        />
      )}
    </TasksUpsellContext.Provider>
  )
}
