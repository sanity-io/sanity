import {useTelemetry} from '@sanity/telemetry/react'
import {type ReactNode, useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {BehaviorSubject, catchError, distinctUntilChanged, EMPTY, switchMap} from 'rxjs'
import {FreeTrialContext} from 'sanity/_singletons'
import {useRouter} from 'sanity/router'

import {useClient} from '../../../../hooks/useClient'
import {SANITY_VERSION} from '../../../../version'
import {getTrialStage, TrialDialogViewed} from './__telemetry__/trialDialogEvents.telemetry'
import {type FreeTrialResponse} from './types'
/**
 * @internal
 */
export interface FreeTrialProviderProps {
  children: ReactNode
}

/**
 * @internal
 */
export const FreeTrialProvider = ({children}: FreeTrialProviderProps) => {
  const router = useRouter()
  const [dismissedFetchKey, setDismissedFetchKey] = useState<string | null>(null)
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const client = useClient({apiVersion: '2023-12-11'})
  const telemetry = useTelemetry()

  // See if we have any parameters from the current route
  // to pass onto our query
  const searchParams = new URLSearchParams(router.state._searchParams)
  // Allows us to override the current state of the trial to
  // get back certain modals based on the current experience
  // can be 'growth-trial', 'growth-trial-ending', or 'post-growth-trial'
  const trialState = searchParams.get('trialState')
  // Allows us to set whether we've seen the modals before
  // or whether this is our first time seeing them (i.e. show a popup)
  const seenBefore = searchParams.get('seenBefore')
  // Key auto-dismiss to the same inputs that drive the trial request so a URL
  // override / refetch can show again (matches prior effect setShowOnLoad(true)).
  const fetchKey = `${trialState ?? ''}:${seenBefore ?? ''}`

  // Bridge the params into a stable stream so a param change refetches within
  // the same subscription: the last response stays visible while the refetch
  // is in flight, and a failed refetch keeps it (matches the previous
  // setState behavior).
  const [params$] = useState(() => new BehaviorSubject({seenBefore, trialState}))
  useEffect(() => {
    params$.next({seenBefore, trialState})
  }, [params$, seenBefore, trialState])

  const data = useObservable(
    useMemo(
      () =>
        params$.pipe(
          distinctUntilChanged(
            (prev, next) =>
              prev.trialState === next.trialState && prev.seenBefore === next.seenBefore,
          ),
          switchMap((params) => {
            const queryParams = new URLSearchParams()
            queryParams.append('studioVersion', SANITY_VERSION)
            if (params.trialState) queryParams.append('trialState', params.trialState)
            if (params.seenBefore) queryParams.append('seenBefore', params.seenBefore)
            // If we have trialState, query the override endpoint so that we
            // get back trial modals for that state
            const queryURL = queryParams.get('trialState')
              ? `/journey/trial/override`
              : `/journey/trial`

            return client.observable
              .request<FreeTrialResponse | null>({
                url: `${queryURL}?${queryParams.toString()}`,
              })
              .pipe(catchError(() => EMPTY))
          }),
        ),
      [client, params$],
    ),
    null,
  )

  // Derive auto-show from the response instead of syncing into state in an effect
  const showOnLoad = Boolean(data?.showOnLoad) && dismissedFetchKey !== fetchKey
  const showDialog = showOnLoad || manualDialogOpen

  // Whenever showDialog changes, run effect to track
  // the dialog view
  useEffect(() => {
    const dialog = data?.showOnLoad
    if (showDialog && showOnLoad && dialog) {
      telemetry.log(TrialDialogViewed, {
        dialogId: dialog.id,
        dialogRevision: dialog._rev,
        dialogTrialStage: getTrialStage({showOnLoad, dialogId: dialog.id}),
        dialogTrigger: showOnLoad ? 'auto' : 'fromClick',
        dialogType: dialog.dialogType,
        source: 'studio',
        trialDaysLeft: data.daysLeft,
      })
    }
  }, [showDialog, data, showOnLoad, telemetry])

  const toggleShowContent = (closeAndReOpen = false) => {
    if (showOnLoad) {
      setDismissedFetchKey(fetchKey)
      // If the user clicks on the button, while the show on load is open, we want to trigger the modal.
      setManualDialogOpen(closeAndReOpen)
      if (data?.showOnLoad?.id) {
        void client.request({url: `/journey/trial/${data?.showOnLoad.id}`, method: 'POST'})
      }
    } else {
      setManualDialogOpen((p) => !p)
    }
  }

  return (
    <FreeTrialContext.Provider value={{data, showDialog, toggleShowContent, showOnLoad}}>
      {children}
    </FreeTrialContext.Provider>
  )
}
