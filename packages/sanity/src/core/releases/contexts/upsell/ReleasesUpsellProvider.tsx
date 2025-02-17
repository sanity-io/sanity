import {useTelemetry} from '@sanity/telemetry/react'
import {template} from 'lodash'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {firstValueFrom, of} from 'rxjs'
import {delay, tap} from 'rxjs/operators'
import {ReleasesUpsellContext} from 'sanity/_singletons'

import {useClient, useFeatureEnabled, useProjectId} from '../../../hooks'
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
import {useOrgActiveReleaseCount} from '../../store/useOrgActiveReleaseCount'
import {useReleaseLimits} from '../../store/useReleaseLimits'
import {type ReleasesUpsellContextValue} from './types'

type ReleaseLimits = {
  datasetReleaseLimit: number
  orgActiveReleaseCount: number
  orgActiveReleaseLimit: number
}

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

export const fetchReleasesLimits = () =>
  of({
    orgActiveReleaseCount: 10,
    orgActiveReleaseLimit: 20,
    datasetReleaseLimit: 6,

    // orgActiveReleaseCount: 6,
    // orgActiveReleaseLimit: 6,
    // datasetReleaseLimit: 10,
  }).pipe(
    tap(() => console.log('fetchReleasesLimits')),
    delay(3000),
  )

/**
 * @beta
 * @hidden
 */
export function ReleasesUpsellProvider(props: {children: React.ReactNode}) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const [upsellData, setUpsellData] = useState<UpsellData | null>(null)
  const projectId = useProjectId()
  const telemetry = useTelemetry()
  const client = useClient({apiVersion: API_VERSION})
  const [releaseLimit, setReleaseLimit] = useState<number | undefined>(undefined)
  const {data: activeReleases} = useActiveReleases()
  const {enabled: isReleasesFeatureEnabled} = useFeatureEnabled('contentReleases')

  const mode = useMemo(() => {
    /**
     * upsell if:
     * plan is free, ie releases is not feature enabled
     * there is a limit and the limit is reached or exceeded
     */
    const isAtReleaseLimit =
      !isReleasesFeatureEnabled || (releaseLimit && (activeReleases?.length || 0) >= releaseLimit)
    if (isAtReleaseLimit && upsellData) {
      return 'upsell'
    }
    if (isAtReleaseLimit && !upsellData) {
      return 'disabled'
    }
    return 'default'
  }, [activeReleases?.length, isReleasesFeatureEnabled, releaseLimit, upsellData])

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
    const data$ = client.observable.request<UpsellData | null>({
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

  const handleOpenDialog = useCallback(() => {
    setUpsellDialogOpen(true)

    telemetry.log(UpsellDialogViewed, {
      feature: FEATURE,
      type: 'modal',
      source: 'navbar',
    })
  }, [telemetry])

  const {getReleaseLimits, setLimitsManually} = useReleaseLimits()
  const {getOrgActiveReleaseCount, setOrgActiveReleaseCountManually} = useOrgActiveReleaseCount()

  const guardWithReleaseLimitUpsell = useCallback(
    async (cb: (limits: any | undefined) => void, throwError: boolean = false) => {
      console.log('Guard called, checking caches...')

      const existingLimits = getReleaseLimits()
      const existingOrgActiveReleaseCount = getOrgActiveReleaseCount()

      console.log({existingLimits, existingOrgActiveReleaseCount})

      if (existingLimits && existingOrgActiveReleaseCount !== null) {
        console.log('Both caches valid, skipping fetch.')
        return cb({
          datasetReleaseLimit: existingLimits.datasetReleaseLimit,
          orgActiveReleaseLimit: existingLimits.orgActiveReleaseLimit,
          orgActiveReleaseCount: existingOrgActiveReleaseCount,
        })
      }

      console.log('Fetching new data since cache is missing or expired...')

      try {
        const limits = await firstValueFrom(fetchReleasesLimits()) // ✅ Fetch API once

        if (!existingLimits) {
          console.log('setting release limits', {limits})
          setLimitsManually({
            datasetReleaseLimit: limits.datasetReleaseLimit,
            orgActiveReleaseLimit: limits.orgActiveReleaseLimit,
          })
        }

        if (existingOrgActiveReleaseCount === null) {
          setOrgActiveReleaseCountManually(limits.orgActiveReleaseCount)
        }

        const {datasetReleaseLimit, orgActiveReleaseLimit, orgActiveReleaseCount} = limits
        const activeReleasesCount = activeReleases?.length || 0

        const shouldShowDialog =
          activeReleasesCount >= datasetReleaseLimit ||
          (orgActiveReleaseLimit !== null && orgActiveReleaseCount >= orgActiveReleaseLimit)

        if (shouldShowDialog) {
          handleOpenDialog()
          if (throwError) {
            throw new StudioReleaseLimitExceededError()
          }
          return
        }

        cb({datasetReleaseLimit, orgActiveReleaseLimit, orgActiveReleaseCount})
      } catch (error) {
        console.error('Error fetching release limits:', error)
      }
    },
    [
      activeReleases?.length,
      handleOpenDialog,
      getReleaseLimits,
      setLimitsManually,
      getOrgActiveReleaseCount,
      setOrgActiveReleaseCountManually,
    ],
  )

  const onReleaseLimitReached = useCallback(
    (limit: number, suppressDialogOpening: boolean = false) => {
      setReleaseLimit(limit)

      if (!suppressDialogOpening && (activeReleases?.length || 0) >= limit) {
        handleOpenDialog()
      }
    },
    [activeReleases?.length, handleOpenDialog],
  )

  const ctxValue = useMemo<ReleasesUpsellContextValue>(
    () => ({
      mode,
      upsellDialogOpen,
      guardWithReleaseLimitUpsell,
      onReleaseLimitReached,
      telemetryLogs,
    }),
    [mode, upsellDialogOpen, guardWithReleaseLimitUpsell, onReleaseLimitReached, telemetryLogs],
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
