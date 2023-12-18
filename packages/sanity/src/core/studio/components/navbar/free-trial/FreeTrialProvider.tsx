import {useCallback, useEffect, useState} from 'react'
import {useClient} from '../../../../hooks'
import {SANITY_VERSION} from '../../../../version'
import {supportsLocalStorage} from '../../../../util/supportsLocalStorage'
import {FreeTrialContext} from './FreeTrialContext'
import type {FreeTrialResponse} from './types'

/**
 * @internal
 */
export interface FreeTrialProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */
export const FreeTrialProvider = ({children}: FreeTrialProviderProps) => {
  const [data, setData] = useState<FreeTrialResponse | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showOnLoad, setShowOnLoad] = useState(false)
  const client = useClient({apiVersion: '2023-12-11'})

  useEffect(() => {
    const request = client.observable
      .request<FreeTrialResponse | null>({
        url: `/journey/trial?studioVersion=${SANITY_VERSION}`,
      })
      .subscribe((response) => {
        setData(response)
        // Validates if the user has seen the "structure rename modal" before showing this one. To avoid multiple popovers at same time.
        const deskRenameSeen = isDeskRenameOnboardingDismissed()
        if (deskRenameSeen && response?.showOnLoad) {
          setShowOnLoad(true)
          setShowDialog(true)
        }
      })

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

function isDeskRenameOnboardingDismissed() {
  return supportsLocalStorage
    ? localStorage.getItem('sanityStudio:desk:renameDismissed') === '1'
    : true
}
