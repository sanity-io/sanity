import {useTelemetry} from '@sanity/telemetry/react'
import {type ReactNode, useCallback, useEffect, useState} from 'react'
import {useRouter} from 'sanity/router'

import {useClient} from '../../../../hooks'
import {SANITY_VERSION} from '../../../../version'
import {getTrialStage, TrialDialogViewed} from './__telemetry__/trialDialogEvents.telemetry'
import {FreeTrialContext} from './FreeTrialContext'
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
  const [data, setData] = useState<FreeTrialResponse | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showOnLoad, setShowOnLoad] = useState(false)
  const client = useClient({apiVersion: '2023-12-11'})
  const telemetry = useTelemetry()

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

  // This is casted to a string to make it stable across renders so it doesn't trigger multiple times the effect.
  const searchParamsAsString = new URLSearchParams(router.state._searchParams).toString()

  useEffect(() => {
    // See if we have any parameters from the current route
    // to pass onto our query
    const searchParams = new URLSearchParams(searchParamsAsString)

    const queryParams = new URLSearchParams()
    queryParams.append('studioVersion', SANITY_VERSION)
    // Allows us to override the current state of the trial to
    // get back certain modals based on the current experience
    // can be 'growth-trial', 'growth-trial-ending', or 'post-growth-trial'
    const trialState = searchParams.get('trialState')
    if (trialState) queryParams.append('trialState', trialState)
    // Allows us to set whether we've seen the modals before
    // or whether this is our first time seeing them (i.e. show a popup)
    const seenBefore = searchParams.get('seenBefore')
    if (seenBefore) queryParams.append('seenBefore', seenBefore)
    // If we have trialState, query the override endpoint so that we
    // get back trial modals for that state
    const queryURL = queryParams.get('trialState') ? `/journey/trial/override` : `/journey/trial`
    const request = client.observable
      .request<FreeTrialResponse | null>({
        url: `${queryURL}?${queryParams.toString()}`,
      })
      .subscribe(
        (response) => {
          setData(response)
          if (response?.showOnLoad) {
            setShowOnLoad(true)
            setShowDialog(true)
          }
        },
        () => {
          /* silently ignore any error */
        },
      )

    return () => {
      request.unsubscribe()
    }
  }, [client, searchParamsAsString])

  const toggleShowContent = useCallback(
    (closeAndReOpen = false) => {
      if (showOnLoad) {
        setShowOnLoad(false)
        // If the user clicks on the button, while the show on load is open, we want to trigger the modal.
        setShowDialog(closeAndReOpen)
        if (data?.showOnLoad?.id) {
          client.request({url: `/journey/trial/${data?.showOnLoad.id}`, method: 'POST'})
        }
      } else {
        setShowDialog((p) => !p)
      }
    },
    [client, showOnLoad, data?.showOnLoad?.id],
  )

  return (
    <FreeTrialContext.Provider value={{data, showDialog, toggleShowContent, showOnLoad}}>
      {children}
    </FreeTrialContext.Provider>
  )
}
