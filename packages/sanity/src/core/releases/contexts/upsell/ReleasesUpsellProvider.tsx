import {useTelemetry} from '@sanity/telemetry/react'
import {template} from 'lodash'
import {type FC, type PropsWithChildren, useCallback, useEffect, useMemo, useState} from 'react'

import {ReleasesUpsellContext} from '../../../../_singletons/context/ReleasesUpsellContext'
import {ConditionalWrapper} from '../../../../ui-components'
import {useClient, useProjectId} from '../../../hooks'
import {useProjectSubscriptions} from '../../../hooks/useProjectSubscriptions'
import {
  UpsellDialogDismissed,
  UpsellDialogLearnMoreCtaClicked,
  UpsellDialogUpgradeCtaClicked,
  UpsellDialogViewed,
  type UpsellDialogViewedInfo,
  useWorkspace,
} from '../../../studio'
import {type UpsellData} from '../../../studio/upsell/types'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {type ReleasesUpsellContextValue} from './types'

const FEATURE = 'tasks'
const TEMPLATE_OPTIONS = {interpolate: /{{([\s\S]+?)}}/g}
const BASE_URL = 'www.sanity.io'
// Date when the change from array to object in the data returned was introduced.
const API_VERSION = '2024-04-19'

const FREE_UPSELL = '72a9d606-0f49-45ca-9cf8-e7ed0ba888b7'
const NOT_FREE_UPSELL = 'bb41ee22-4b30-4bc8-81fc-035948a1555a'

function ReleasesUpsellProviderInner(props: {children: React.ReactNode}) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const [upsellData, setUpsellData] = useState<UpsellData | null>(null)
  const projectId = useProjectId()
  const telemetry = useTelemetry()
  const {projectSubscriptions} = useProjectSubscriptions()
  const client = useClient({apiVersion: API_VERSION})
  const {checkReleaseLimit} = useReleaseOperations()

  const telemetryLogs = useMemo(
    (): ReleasesUpsellContextValue['telemetryLogs'] => ({
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
    const data$ = upsellExperienceClient.observable.getDocument(
      // optionally check the status as 'trialling' to restrict free trials to NOT_FREE_UPSELL
      projectSubscriptions?.plan.planTypeId === 'free' ? FREE_UPSELL : NOT_FREE_UPSELL,
    )

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
  }, [client, projectId, projectSubscriptions?.plan.planTypeId, upsellExperienceClient.observable])

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

  const execIfNotUpsell = useCallback(
    async (cb: () => void) => {
      const isAllowedToCreate = await checkReleaseLimit()
      if (isAllowedToCreate) {
        cb()
        return true
      }
      handleOpenDialog('document_action')
      return false
    },
    [checkReleaseLimit, handleOpenDialog],
  )

  const ctxValue = useMemo<ReleasesUpsellContextValue>(
    () => ({
      upsellDialogOpen,
      handleOpenDialog,
      execIfNotUpsell,
      upsellData,
      telemetryLogs,
    }),
    [upsellDialogOpen, handleOpenDialog, execIfNotUpsell, upsellData, telemetryLogs],
  )

  return (
    <ReleasesUpsellContext.Provider value={ctxValue}>
      {props.children}
      {upsellData && upsellDialogOpen && (
        <UpsellDialog
          data={upsellData}
          onClose={handleClose}
          onPrimaryClick={handlePrimaryButtonClick}
          onSecondaryClick={handleSecondaryButtonClick}
        />
      )}
    </ReleasesUpsellContext.Provider>
  )
}

/**
 * @beta
 * @hidden
 */
export const ReleasesUpsellProvider: FC<PropsWithChildren> = (props) => {
  const isReleasesEnabled = !!useWorkspace().releases?.enabled

  return (
    <ConditionalWrapper
      condition={isReleasesEnabled}
      // eslint-disable-next-line react/jsx-no-bind
      wrapper={(children) => <ReleasesUpsellProviderInner>{children}</ReleasesUpsellProviderInner>}
    >
      {props.children}
    </ConditionalWrapper>
  )
}
