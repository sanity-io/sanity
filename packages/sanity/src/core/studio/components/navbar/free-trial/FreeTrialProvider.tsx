import {type ReactNode, useCallback, useEffect, useState} from 'react'
import {useTelemetry} from '@sanity/telemetry/react'

import {useClient} from '../../../../hooks'
import {SANITY_VERSION} from '../../../../version'
import {FreeTrialContext} from './FreeTrialContext'
import {type FreeTrialResponse} from './types'
import {TrialDialogViewed, getTrialStage} from './__telemetry__/trialDialogEvents.telemetry'

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
  const [data, setData] = useState<FreeTrialResponse | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showOnLoad, setShowOnLoad] = useState(false)
  const client = useClient({apiVersion: '2023-12-11'})
  const telemetry = useTelemetry()

  // Whenever showDialog changes, run effect to track
  // the dialog view
  useEffect(() => {
    const dialog = data?.showOnLoad || data?.showOnClick
    if (showDialog && dialog) {
      telemetry.log(TrialDialogViewed, {
        dialogId: dialog.id,
        dialogRevision: dialog._rev,
        dialogTrialStage: getTrialStage({showOnLoad, dialogId: dialog.id}),
        dialogTrigger: showOnLoad ? 'auto' : 'from_click',
        dialogType: dialog.dialogType,
        source: 'studio',
        trialDaysLeft: data.daysLeft,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDialog])

  useEffect(() => {
    const request = client.observable
      .request<FreeTrialResponse | null>({
        url: `/journey/trial?studioVersion=${SANITY_VERSION}`,
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
  }, [client])

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
