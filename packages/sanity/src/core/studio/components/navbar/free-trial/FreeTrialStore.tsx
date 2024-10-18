import {useTelemetry} from '@sanity/telemetry/react'
import {useEffect} from 'react'
import {useRouter} from 'sanity/router'
import {create} from 'zustand'

import {useClient} from '../../../../hooks'
import {SANITY_VERSION} from '../../../../version'
import {getTrialStage, TrialDialogViewed} from './__telemetry__/trialDialogEvents.telemetry'
import {type FreeTrialResponse} from './types'

interface FreeTrialState {
  // State
  data: FreeTrialResponse | null
  showDialog: boolean
  showOnLoad: boolean

  // Actions
  setData: (data: FreeTrialResponse | null) => void
  setShowDialog: (show: boolean) => void
  setShowOnLoad: (show: boolean) => void
}

// Zustand state management store
const useFreeTrialStore = create<FreeTrialState>((set) => ({
  data: null,
  showDialog: false,
  showOnLoad: false,

  setData: (data) => set({data}),
  setShowDialog: (show) => set({showDialog: show}),
  setShowOnLoad: (show) => set({showOnLoad: show}),
}))

// Custom hook that combines Zustand store with other hooks
export const useFreeTrial = () => {
  const router = useRouter()
  const client = useClient({apiVersion: '2023-12-11'})
  const telemetry = useTelemetry()

  const {data, showDialog, showOnLoad, setData, setShowDialog, setShowOnLoad} = useFreeTrialStore()

  // Toggle show content function that needs client
  const toggleShowContent = async (closeAndReOpen = false) => {
    if (showOnLoad) {
      setShowOnLoad(false)
      setShowDialog(closeAndReOpen)
      if (data?.showOnLoad?.id) {
        await client.request({
          url: `/journey/trial/${data.showOnLoad.id}`,
          method: 'POST',
        })
      }
    } else {
      setShowDialog(!showDialog)
    }
  }

  // Effect for telemetry tracking
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
  }, [client, router.state._searchParams, setData, setShowDialog, setShowOnLoad])

  return {
    data,
    showDialog,
    showOnLoad,
    toggleShowContent,
  }
}
