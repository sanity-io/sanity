import {useTelemetry} from '@sanity/telemetry/react'
import {type ReactNode, useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, of} from 'rxjs'
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
  const [dismissedAutoShow, setDismissedAutoShow] = useState(false)
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

  const data = useObservable(
    useMemo(() => {
      const queryParams = new URLSearchParams()
      queryParams.append('studioVersion', SANITY_VERSION)
      if (trialState) queryParams.append('trialState', trialState)
      if (seenBefore) queryParams.append('seenBefore', seenBefore)
      // If we have trialState, query the override endpoint so that we
      // get back trial modals for that state
      const queryURL = queryParams.get('trialState') ? `/journey/trial/override` : `/journey/trial`

      return client.observable
        .request<FreeTrialResponse | null>({
          url: `${queryURL}?${queryParams.toString()}`,
        })
        .pipe(catchError(() => of(null)))
    }, [client, seenBefore, trialState]),
    null,
  )

  // Derive auto-show from the response instead of syncing into state in an effect
  const showOnLoad = Boolean(data?.showOnLoad) && !dismissedAutoShow
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
      setDismissedAutoShow(true)
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
