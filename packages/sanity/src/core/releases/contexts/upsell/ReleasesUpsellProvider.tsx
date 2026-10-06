import {useToast} from '@sanity/ui/toast'
import {Suspense, use, useCallback, useEffect, useMemo, useState} from 'react'
import {type ObservablePromise, preloadObservablePromise, useObservablePromise} from 'react-rx'
import {firstValueFrom, tap} from 'rxjs'
import {ReleasesUpsellContext} from 'sanity/_singletons'

import {useFeatureEnabled, FEATURES} from '../../../hooks/useFeatureEnabled'
import {useUpsellData} from '../../../hooks/useUpsellData'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {type UpsellDialogViewedInfo} from '../../../studio/upsell/__telemetry__/upsell.telemetry'
import {type UpsellDataResult} from '../../../studio/upsell/types'
import {type InterpolationProp} from '../../../studio/upsell/upsellDescriptionSerializer/UpsellDescriptionSerializer'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'
import {isCardinalityOneRelease} from '../../../util/releaseUtils'
import {ReleaseLimitsMisconfigurationDialog} from '../../components/dialog/ReleaseLimitsMisconfigurationDialog'
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
  const {data: allActiveReleases} = useActiveReleases()
  const {enabled: isReleasesFeatureEnabled} = useFeatureEnabled(FEATURES.contentReleases)
  const {upsellData$, telemetryLogs} = useUpsellData({
    dataUri: '/journey/content-releases',
    feature: 'content-releases',
  })
  // Read where it is rendered (the dialog leaf) or awaited (handleOpenDialog); the request starts
  // when the provider commits
  const upsellDataPromise = useObservablePromise(upsellData$)
  useEffect(() => {
    void preloadObservablePromise(upsellData$)
  }, [upsellData$])
  const toast = useToast()
  const {t} = useTranslation()

  const meteredActiveReleases = useMemo(
    () => allActiveReleases.filter((release) => !isCardinalityOneRelease(release)),
    [allActiveReleases],
  )

  const mode = useMemo(() => {
    /**
     * upsell if:
     * plan is free, ie releases is not feature enabled
     */
    if (!isReleasesFeatureEnabled) {
      return 'upsell'
    }
    return 'default'
  }, [isReleasesFeatureEnabled])

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

  const [releaseLimit, setReleaseLimit] = useState<number | null>(null)
  const [showMisconfigurationDialog, setShowMisconfigurationDialog] = useState(false)

  const handleOpenDialog = useCallback(
    (source: UpsellDialogViewedInfo['source'] = 'navbar') => {
      void upsellDataPromise.then(({hasError}) => {
        if (hasError) {
          toast.push({
            status: 'error',
            title: t('errors.unable-to-perform-action'),
            closable: true,
          })
          return
        }

        setUpsellDialogOpen(true)

        telemetryLogs.dialogViewed(source)
      })
    },
    [upsellDataPromise, toast, t, telemetryLogs],
  )

  const {releaseLimits$} = useReleaseLimits()
  const {orgActiveReleaseCount$} = useOrgActiveReleaseCount()

  const guardWithReleaseLimitUpsell = useCallback(
    async (
      cb: () => void,
      throwError: boolean = false,
      whenResolved?: (hasPassed: boolean) => void,
    ) => {
      const doUpsell = (): false => {
        handleOpenDialog()
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
            firstValueFrom(
              releaseLimits$.pipe(
                tap((limit) => setReleaseLimit(limit?.orgActiveReleaseLimit || null)),
              ),
            ),
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

      const [orgMeteredActiveReleaseCount, releaseLimits] = result

      if (releaseLimits === null || orgMeteredActiveReleaseCount === null) {
        whenResolved?.(true)
        return cb()
      }

      const {orgActiveReleaseLimit, datasetReleaseLimit} = releaseLimits

      // Misconfiguration is when the content release feature is enabled
      // but the quota is set to 0
      if (orgActiveReleaseLimit === 0) {
        whenResolved?.(false)
        setShowMisconfigurationDialog(true)
        if (throwError) {
          throw new StudioReleaseLimitExceededError()
        }
        return false
      }

      // orgMeteredActiveReleaseCount might be missing due to internal server error
      // allow pass through guard in that case
      if (orgMeteredActiveReleaseCount === null) {
        whenResolved?.(true)
        return cb()
      }

      const meteredActiveReleaseCount = meteredActiveReleases?.length || 0
      const allActiveReleaseCount = allActiveReleases?.length || 0

      // scheduled drafts and content releases contribute towards reaching the dataset limit
      const isCurrentDatasetAtAboveDatasetLimit = allActiveReleaseCount >= datasetReleaseLimit

      // only metered content releases contribute towards reaching the org limit
      const isCurrentDatasetAtAboveOrgLimit =
        orgActiveReleaseLimit !== null && meteredActiveReleaseCount >= orgActiveReleaseLimit
      const isOrgAtAboveOrgLimit =
        orgActiveReleaseLimit !== null && orgMeteredActiveReleaseCount >= orgActiveReleaseLimit

      const shouldShowDialog =
        isCurrentDatasetAtAboveDatasetLimit ||
        isCurrentDatasetAtAboveOrgLimit ||
        isOrgAtAboveOrgLimit

      if (shouldShowDialog) {
        whenResolved?.(false)
        return doUpsell()
      }

      whenResolved?.(true)
      return cb()
    },
    [
      meteredActiveReleases.length,
      handleOpenDialog,
      allActiveReleases.length,
      mode,
      releaseLimits$,
      orgActiveReleaseCount$,
    ],
  )

  const onReleaseLimitReached = useCallback(
    (limit: number) => {
      setReleaseLimit(limit)
      handleOpenDialog()
    },
    [handleOpenDialog],
  )

  const ctxValue = useMemo<ReleasesUpsellContextValue>(
    () => ({
      mode,
      upsellDialogOpen,
      guardWithReleaseLimitUpsell,
      onReleaseLimitReached,
      telemetryLogs,
      upsellDataPromise,
      handleOpenDialog,
    }),
    [
      mode,
      upsellDialogOpen,
      guardWithReleaseLimitUpsell,
      onReleaseLimitReached,
      telemetryLogs,
      upsellDataPromise,
      handleOpenDialog,
    ],
  )

  const interpolation = useMemo(
    () => (releaseLimit === null ? undefined : {releaseLimit: releaseLimit}),
    [releaseLimit],
  )

  return (
    <ReleasesUpsellContext.Provider value={ctxValue}>
      {props.children}
      {showMisconfigurationDialog ? (
        <ReleaseLimitsMisconfigurationDialog onClose={() => setShowMisconfigurationDialog(false)} />
      ) : (
        upsellDialogOpen && (
          <Suspense>
            <ReleasesUpsellDialog
              upsellDataPromise={upsellDataPromise}
              interpolation={interpolation}
              onClose={handleClose}
              onPrimaryClick={handlePrimaryButtonClick}
              onSecondaryClick={handleSecondaryButtonClick}
            />
          </Suspense>
        )
      )}
    </ReleasesUpsellContext.Provider>
  )
}

interface ReleasesUpsellDialogProps {
  upsellDataPromise: ObservablePromise<UpsellDataResult>
  interpolation: InterpolationProp | undefined
  onClose: () => void
  onPrimaryClick: () => void
  onSecondaryClick: () => void
}

/**
 * Mounted only while the dialog is open, which `handleOpenDialog` does once the upsell content
 * has settled, so the `use()` reads synchronously; the boundary above it covers the case where it
 * does not.
 */
function ReleasesUpsellDialog({upsellDataPromise, ...dialogProps}: ReleasesUpsellDialogProps) {
  const {upsellData} = use(upsellDataPromise)
  return <UpsellDialog data={upsellData} {...dialogProps} />
}
