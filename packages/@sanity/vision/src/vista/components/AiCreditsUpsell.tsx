import {type ReactNode, Suspense, use, useCallback, useEffect, useMemo, useState} from 'react'
import {type ObservablePromise, preloadObservablePromise, useObservablePromise} from 'react-rx'
import {of} from 'rxjs'
import {
  NO_UPSELL_DATA,
  type UpsellDataResult,
  UpsellDialog,
  type UpsellTelemetryLogs,
  useUpsellData,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import {useKnownAiCredits} from '../hooks/useAiCredits'
import {type AiCredits, canUpsellAiCredits} from '../util/aiCredits'
import {
  AiCreditsUpsellContext,
  type AiCreditsUpsellContextValue,
  type AiCreditsUpsellSource,
} from './AiCreditsUpsellContext'

/**
 * Where the upsell content for AI credits is served from, and what its telemetry names the
 * feature. The content is a `journey` document like the ones of comments, tasks and releases,
 * and this is the one place that names it.
 */
const AI_CREDITS_UPSELL = {dataUri: '/journey/ai-credits', feature: 'ai-credits'} as const

/** What the content request settles to where there is nothing to upsell; stable, so it is cached once */
const NO_UPSELL_DATA$ = of(NO_UPSELL_DATA)

export interface AiCreditsUpsellProviderProps {
  /** The project the credits are read through; the store of readings is keyed by it */
  projectId: string
  children: ReactNode
}

/**
 * Upsells a bigger plan to an organization that has used up the AI credits its plan includes:
 * the dialog opens when Agent Actions turn a request down for them, and from the out-of-credits
 * card under every Agent Actions control. The content is requested only once the credits are
 * known to call for it, so a Studio whose organization has credits never asks for it, and where
 * the request fails the card stands on its own, with its link into Manage.
 */
export function AiCreditsUpsellProvider({projectId, children}: AiCreditsUpsellProviderProps) {
  const credits = useKnownAiCredits(projectId)
  const upsellMode = credits !== undefined && canUpsellAiCredits(credits)
  const {upsellData$: content$, telemetryLogs} = useUpsellData(AI_CREDITS_UPSELL)
  const upsellData$ = upsellMode ? content$ : NO_UPSELL_DATA$
  const upsellDataPromise = useObservablePromise(upsellData$)
  // The request starts when the credits call for it, not when the dialog opens, so the dialog
  // has its content by the time a turned-down request opens it
  useEffect(() => {
    void preloadObservablePromise(upsellData$)
  }, [upsellData$])

  const [openedFrom, setOpenedFrom] = useState<AiCreditsUpsellSource | null>(null)
  const openDialog = useCallback((source: AiCreditsUpsellSource) => setOpenedFrom(source), [])
  const requestTurnedDown = useCallback((limit: AiCredits) => {
    if (canUpsellAiCredits(limit)) setOpenedFrom('agent_action')
  }, [])
  const handleUnavailable = useCallback(() => setOpenedFrom(null), [])
  const handleClose = useCallback(() => {
    setOpenedFrom(null)
    telemetryLogs.dialogDismissed()
  }, [telemetryLogs])

  const value = useMemo(
    (): AiCreditsUpsellContextValue => ({upsellDataPromise, openDialog, requestTurnedDown}),
    [upsellDataPromise, openDialog, requestTurnedDown],
  )

  return (
    <AiCreditsUpsellContext.Provider value={value}>
      {children}
      {openedFrom && (
        <Suspense fallback={null}>
          <AiCreditsUpsellDialog
            onClose={handleClose}
            onUnavailable={handleUnavailable}
            source={openedFrom}
            telemetryLogs={telemetryLogs}
            upsellDataPromise={upsellDataPromise}
          />
        </Suspense>
      )}
    </AiCreditsUpsellContext.Provider>
  )
}

interface AiCreditsUpsellDialogProps {
  source: AiCreditsUpsellSource
  upsellDataPromise: ObservablePromise<UpsellDataResult>
  telemetryLogs: UpsellTelemetryLogs
  onClose: () => void
  /** The content did not come: the dialog closes again without having been seen */
  onUnavailable: () => void
}

/**
 * The open dialog: reads the content with `use()`, so it renders under a `Suspense` boundary.
 * Without content there is nothing to show, and the out-of-credits card that is already under
 * the control says what happened, so it closes again quietly.
 */
function AiCreditsUpsellDialog(props: AiCreditsUpsellDialogProps) {
  const {source, upsellDataPromise, telemetryLogs, onClose, onUnavailable} = props
  const {upsellData} = use(upsellDataPromise)
  const available = upsellData !== null

  useEffect(() => {
    if (available) telemetryLogs.dialogViewed(source)
    else onUnavailable()
  }, [available, onUnavailable, source, telemetryLogs])

  if (!upsellData) return null
  return (
    <UpsellDialog
      data={upsellData}
      onClose={onClose}
      onPrimaryClick={telemetryLogs.dialogPrimaryClicked}
      onSecondaryClick={telemetryLogs.dialogSecondaryClicked}
    />
  )
}
