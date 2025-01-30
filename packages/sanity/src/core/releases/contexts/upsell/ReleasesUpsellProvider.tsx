import {useTelemetry} from '@sanity/telemetry/react'
import {template} from 'lodash'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {ReleasesUpsellContext} from 'sanity/_singletons'

import {useClient, useProjectId} from '../../../hooks'
import {useProjectSubscriptions} from '../../../hooks/useProjectSubscriptions'
import {
  UpsellDialogDismissed,
  UpsellDialogLearnMoreCtaClicked,
  UpsellDialogUpgradeCtaClicked,
  UpsellDialogViewed,
} from '../../../studio'
import {TEMPLATE_OPTIONS} from '../../../studio/upsell/constants'
import {type UpsellData} from '../../../studio/upsell/types'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'
import {useActiveReleases} from '../../store/useActiveReleases'
import {FALLBACK_DIALOG} from './fallbackDialogData'
import {type ReleasesUpsellContextValue} from './types'

class StudioReleaseLimitExceededError extends Error {
  details: {type: 'releaseLimitExceededError'}

  constructor() {
    super('StudioReleaseLimitExceeded')
    this.name = 'StudioReleaseLimitExceededError'
    this.details = {
      type: 'releaseLimitExceededError',
    }
  }
}

const FEATURE = 'content-releases'
const BASE_URL = 'www.sanity.io'
// Date when the change from array to object in the data returned was introduced.
const API_VERSION = '2024-04-19'

/**
 * @beta
 * @hidden
 */
export function ReleasesUpsellProvider(props: {children: React.ReactNode}) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const [upsellData, setUpsellData] = useState<Pick<
    UpsellData,
    'ctaButton' | 'descriptionText' | 'image' | 'secondaryButton'
  > | null>(null)
  const projectId = useProjectId()
  const telemetry = useTelemetry()
  const {projectSubscriptions} = useProjectSubscriptions()
  const client = useClient({apiVersion: API_VERSION})
  const upsellExperienceClient = client.withConfig({projectId: 'pyrmmpch', dataset: 'development'})
  const [releaseLimit, setReleaseLimit] = useState<number | undefined>(undefined)
  const {data: activeReleases} = useActiveReleases()

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
    // @todo: once personalization forge deployed to prod, remove the `vX`
    const data$ = client.withConfig({apiVersion: 'vX'}).observable.request<UpsellData | null>({
      uri: '/journey/content-releases',
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
          setUpsellData(FALLBACK_DIALOG)
        }
      },
      error: () => {
        setUpsellData(FALLBACK_DIALOG)
      },
    })

    return () => {
      sub.unsubscribe()
    }
  }, [client, projectId, projectSubscriptions?.plan.planTypeId, upsellExperienceClient.observable])

  const handleOpenDialog = useCallback(() => {
    setUpsellDialogOpen(true)

    telemetry.log(UpsellDialogViewed, {
      feature: FEATURE,
      type: 'modal',
      source: 'navbar',
    })
  }, [telemetry])

  const guardWithReleaseLimitUpsell = useCallback(
    (cb: () => void, throwError: boolean = false) => {
      const isAllowedToCreate =
        releaseLimit === undefined || releaseLimit > (activeReleases?.length || 0)

      if (isAllowedToCreate) {
        return cb()
      }

      handleOpenDialog()
      if (throwError) {
        throw new StudioReleaseLimitExceededError()
      }
      return false
    },
    [activeReleases?.length, handleOpenDialog, releaseLimit],
  )

  const onReleaseLimitReached = useCallback(
    (limit: number) => {
      setReleaseLimit(limit)

      if ((activeReleases?.length || 0) >= limit) {
        handleOpenDialog()
      }
    },
    [activeReleases?.length, handleOpenDialog],
  )

  const ctxValue = useMemo<ReleasesUpsellContextValue>(
    () => ({
      upsellDialogOpen,
      guardWithReleaseLimitUpsell,
      onReleaseLimitReached,
      telemetryLogs,
    }),
    [upsellDialogOpen, guardWithReleaseLimitUpsell, onReleaseLimitReached, telemetryLogs],
  )

  const interpolation = releaseLimit ? {releaseLimit} : undefined

  return (
    <ReleasesUpsellContext.Provider value={ctxValue}>
      {props.children}
      {upsellData && upsellDialogOpen && (
        <UpsellDialog
          interpolation={interpolation}
          data={upsellData}
          onClose={handleClose}
          onPrimaryClick={handlePrimaryButtonClick}
          onSecondaryClick={handleSecondaryButtonClick}
        />
      )}
    </ReleasesUpsellContext.Provider>
  )
}
