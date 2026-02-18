import {useTelemetry} from '@sanity/telemetry/react'
import {useEffect, useMemo, useRef} from 'react'

import {
  type PublishButtonDisabledReason,
  PublishButtonReadyTrace,
} from './__telemetry__/documentActions.telemetry'

interface UsePublishButtonTelemetryProps {
  published: boolean
  draft: boolean
  version: boolean
  publishScheduled: boolean
  transactionSyncLockEnabled: boolean
  publishStatus: 'publishing' | 'published' | null
  hasValidationErrors: boolean
  publishDisabled: string | false
  isPermissionsLoading: boolean
  permissionsGranted: boolean
  isSyncing: boolean
}

/**
 * Traces the time from the publish button becoming disabled to becoming enabled again.
 * Purely observational — no side effects on the publish flow.
 */
export function usePublishButtonTelemetry(props: UsePublishButtonTelemetryProps): void {
  const {
    published,
    draft,
    version,
    publishScheduled,
    transactionSyncLockEnabled,
    publishStatus,
    hasValidationErrors,
    publishDisabled,
    isPermissionsLoading,
    permissionsGranted,
    isSyncing,
  } = props

  const telemetry = useTelemetry()

  const disabledReasons = useMemo(() => {
    const reasons: string[] = []
    if (publishScheduled) reasons.push('PUBLISH_SCHEDULED')
    if (transactionSyncLockEnabled) reasons.push('TRANSACTION_SYNC_LOCK')
    if (publishStatus === 'publishing') reasons.push('PUBLISHING')
    if (publishStatus === 'published') reasons.push('PUBLISHED')
    if (hasValidationErrors) reasons.push('VALIDATION_ERROR')
    if (publishDisabled) reasons.push(publishDisabled)
    if (isPermissionsLoading) reasons.push('PERMISSIONS_LOADING')
    if (!isPermissionsLoading && !permissionsGranted) reasons.push('PERMISSION_DENIED')
    if (isSyncing) reasons.push('SYNCING')
    return reasons
  }, [
    publishScheduled,
    transactionSyncLockEnabled,
    publishStatus,
    hasValidationErrors,
    publishDisabled,
    isPermissionsLoading,
    permissionsGranted,
    isSyncing,
  ])

  const isEffectivelyDisabled = useMemo(() => {
    if (published && !draft && !version) return true
    if (!isPermissionsLoading && !permissionsGranted) return true

    return Boolean(
      publishScheduled ||
        transactionSyncLockEnabled ||
        publishStatus === 'publishing' ||
        publishStatus === 'published' ||
        hasValidationErrors ||
        publishDisabled ||
        isPermissionsLoading,
    )
  }, [
    published,
    draft,
    version,
    isPermissionsLoading,
    permissionsGranted,
    publishScheduled,
    transactionSyncLockEnabled,
    publishStatus,
    hasValidationErrors,
    publishDisabled,
  ])

  // Time-to-ready trace
  const readyTraceRef = useRef<ReturnType<typeof telemetry.trace> | null>(null)
  const disabledReasonAtRef = useRef<PublishButtonDisabledReason | 'unknown'>('unknown')

  useEffect(() => {
    if (isEffectivelyDisabled) {
      if (readyTraceRef.current === null) {
        const trace = telemetry.trace(PublishButtonReadyTrace)
        trace.start()
        readyTraceRef.current = trace
        disabledReasonAtRef.current =
          (disabledReasons[0] as PublishButtonDisabledReason) || 'unknown'
      }
    } else {
      if (readyTraceRef.current !== null) {
        readyTraceRef.current.log({
          disabledReason: disabledReasonAtRef.current,
        })
        readyTraceRef.current.complete()
        readyTraceRef.current = null
      }
    }
  }, [isEffectivelyDisabled, disabledReasons, telemetry])
}
