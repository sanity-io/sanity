import {useTelemetry} from '@sanity/telemetry/react'
import {useEffect} from 'react'
import {useRouter} from 'sanity/router'
import {proxy, useSnapshot} from 'valtio'
import {devtools} from 'valtio/utils'

import {useClient} from '../../../../hooks'
import {SANITY_VERSION} from '../../../../version'
import {getTrialStage, TrialDialogViewed} from './__telemetry__/trialDialogEvents.telemetry'
import {type FreeTrialResponse} from './types'

interface FreeTrialState {
  data: FreeTrialResponse | null
  showDialog: boolean
  showOnLoad: boolean
}

// Create the Valtio state
// The export of the state is optional to be used outside of React components
export const freeTrialState = proxy<FreeTrialState>({
  data: null,
  showDialog: false,
  showOnLoad: false,
})

// Redux devtools integration
devtools(freeTrialState, {name: 'FreeTrialStore', enabled: true})

// Actions
// The export of the actions is optional to be used outside of React components
export const freeTrialActions = {
  setData(data: FreeTrialResponse | null): void {
    freeTrialState.data = data
  },

  setShowDialog(show: boolean): void {
    freeTrialState.showDialog = show
  },

  setShowOnLoad(show: boolean): void {
    freeTrialState.showOnLoad = show
  },
}

// Custom hook that combines Valtio state with React hooks
export const useFreeTrial = () => {
  const router = useRouter()
  const client = useClient({apiVersion: '2023-12-11'})
  const telemetry = useTelemetry()

  // Get Valtio snapshot of the state
  const snap = useSnapshot(freeTrialState)

  // Toggle show content function that needs client
  const toggleShowContent = async (closeAndReOpen = false) => {
    if (snap.showOnLoad) {
      freeTrialActions.setShowOnLoad(false)
      freeTrialActions.setShowDialog(closeAndReOpen)
      if (snap.data?.showOnLoad?.id) {
        await client.request({
          url: `/journey/trial/${snap.data.showOnLoad.id}`,
          method: 'POST',
        })
      }
    } else {
      freeTrialActions.setShowDialog(!snap.showDialog)
    }
  }

  // Effect for telemetry tracking
  useEffect(() => {
    const dialog = snap.data?.showOnLoad
    if (snap.showDialog && snap.showOnLoad && dialog) {
      telemetry.log(TrialDialogViewed, {
        dialogId: dialog.id,
        dialogRevision: dialog._rev,
        dialogTrialStage: getTrialStage({
          showOnLoad: snap.showOnLoad,
          dialogId: dialog.id,
        }),
        dialogTrigger: snap.showOnLoad ? 'auto' : 'fromClick',
        dialogType: dialog.dialogType,
        source: 'studio',
        trialDaysLeft: snap.data.daysLeft,
      })
    }
  }, [snap.showDialog, snap.data, snap.showOnLoad, telemetry])

  // Effect for initialization
  useEffect(() => {
    const searchParams = new URLSearchParams(router.state._searchParams)
    const queryParams = new URLSearchParams()
    queryParams.append('studioVersion', SANITY_VERSION)

    const trialState = searchParams.get('trialState')
    if (trialState) queryParams.append('trialState', trialState)

    const seenBefore = searchParams.get('seenBefore')
    if (seenBefore) queryParams.append('seenBefore', seenBefore)

    const queryURL = queryParams.get('trialState') ? `/journey/trial/override` : `/journey/trial`

    const request = client.observable
      .request<FreeTrialResponse | null>({
        url: `${queryURL}?${queryParams.toString()}`,
      })
      .subscribe(
        (response) => {
          freeTrialActions.setData(response)
          if (response?.showOnLoad) {
            freeTrialActions.setShowOnLoad(true)
            freeTrialActions.setShowDialog(true)
          }
        },
        () => {
          /* silently ignore any error */
        },
      )

    return () => {
      request.unsubscribe()
    }
  }, [client, router.state._searchParams])

  return {
    data: snap.data,
    showDialog: snap.showDialog,
    showOnLoad: snap.showOnLoad,
    toggleShowContent,
  }
}
