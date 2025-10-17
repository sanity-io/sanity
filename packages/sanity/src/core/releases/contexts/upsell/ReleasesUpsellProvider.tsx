import {useCallback, useMemo, useState} from 'react'
import {firstValueFrom} from 'rxjs'
import {ReleasesUpsellContext} from 'sanity/_singletons'

import {FEATURES, useFeatureEnabled} from '../../../hooks/useFeatureEnabled'
import {useUpsellData} from '../../../hooks/useUpsellData'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'
import {useActiveReleases} from '../../store/useActiveReleases'
import {useOrgActiveReleaseCount} from '../../store/useOrgActiveReleaseCount'
import {useReleaseLimits} from '../../store/useReleaseLimits'
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

/**
 * @beta
 * @hidden
 */
export function ReleasesUpsellProvider(props: {children: React.ReactNode}) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const {data: activeReleases} = useActiveReleases()
  const {enabled: isReleasesFeatureEnabled} = useFeatureEnabled(FEATURES.contentReleases)
  const {upsellData, telemetryLogs} = useUpsellData({
    dataUri: '/journey/content-releases',
    feature: 'content-releases',
  })

  const mode = useMemo(() => {
    /**
     * upsell if:
     * plan is free, ie releases is not feature enabled
     */
    if (!isReleasesFeatureEnabled && upsellData) {
      return 'upsell'
    }
    if (isReleasesFeatureEnabled && !upsellData) {
      return 'disabled'
    }
    return 'default'
  }, [isReleasesFeatureEnabled, upsellData])

  const handlePrimaryButtonClick = useCallback(() => {
    telemetryLogs.dialogPrimaryClicked()
  }, [telemetryLogs])

  const handleSecondaryButtonClick = useCallback(() => {
    telemetryLogs.dialogSecondaryClicked()
  }, [telemetryLogs])

  const handleClose = useCallback(() => {
    setUpsellDialogOpen(false)
    telemetryLogs.dialogDismissed()
  }, [telemetryLogs])

  const [releaseCount, setReleaseCount] = useState<number | null>(null)

  const handleOpenDialog = useCallback(
    (orgActiveReleaseCount?: number) => {
      setUpsellDialogOpen(true)
      if (orgActiveReleaseCount !== undefined) {
        setReleaseCount(orgActiveReleaseCount)
      }
      telemetryLogs.dialogViewed('navbar')
    },
    [telemetryLogs],
  )

  const {releaseLimits$} = useReleaseLimits()
  const {orgActiveReleaseCount$} = useOrgActiveReleaseCount()

  const guardWithReleaseLimitUpsell = useCallback(
    async (
      cb: () => void,
      throwError: boolean = false,
      whenResolved?: (hasPassed: boolean) => void,
    ) => {
      const doUpsell: (count?: number) => false = (count) => {
        handleOpenDialog(count)
        if (throwError) {
          throw new StudioReleaseLimitExceededError()
        }
        return false
      }

      if (mode === 'upsell') {
        whenResolved?.(false)
        return doUpsell()
      }

      const fetchLimitsCount = async () => {
        try {
          // if either fails then catch the error
          return await Promise.all([
            firstValueFrom(orgActiveReleaseCount$),
            firstValueFrom(releaseLimits$),
          ])
        } catch (e) {
          console.error('Error fetching release limits and org count for upsell:', e)

          return null
        }
      }

      const result = await fetchLimitsCount()

      // silently fail and allow pass through guard
      if (result === null) {
        whenResolved?.(true)
        return cb()
      }

      const [orgActiveReleaseCount, releaseLimits] = result

      if (releaseLimits === null || orgActiveReleaseCount === null) {
        whenResolved?.(true)
        return cb()
      }

      const {orgActiveReleaseLimit, datasetReleaseLimit} = releaseLimits

      // orgActiveReleaseCount might be missing due to internal server error
      // allow pass through guard in that case
      if (orgActiveReleaseCount === null) {
        whenResolved?.(true)
        return cb()
      }

      const activeReleasesCount = activeReleases?.length || 0

      const isCurrentDatasetAtAboveDatasetLimit = activeReleasesCount >= datasetReleaseLimit
      const isCurrentDatasetAtAboveOrgLimit =
        orgActiveReleaseLimit !== null && activeReleasesCount >= orgActiveReleaseLimit
      const isOrgAtAboveOrgLimit =
        orgActiveReleaseLimit !== null && orgActiveReleaseCount >= orgActiveReleaseLimit

      const shouldShowDialog =
        isCurrentDatasetAtAboveDatasetLimit ||
        isCurrentDatasetAtAboveOrgLimit ||
        isOrgAtAboveOrgLimit

      if (shouldShowDialog) {
        whenResolved?.(false)
        return doUpsell(orgActiveReleaseCount)
      }

      whenResolved?.(true)
      return cb()
    },
    [mode, handleOpenDialog, orgActiveReleaseCount$, releaseLimits$, activeReleases?.length],
  )

  const onReleaseLimitReached = useCallback(
    (limit: number) => handleOpenDialog(limit),
    [handleOpenDialog],
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

  const interpolation = releaseCount === null ? undefined : {releaseLimit: releaseCount}

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
