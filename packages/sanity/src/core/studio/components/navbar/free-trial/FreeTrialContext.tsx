import React, {createContext, useContext, useState, useCallback, useEffect} from 'react'
import {useClient} from '../../../../hooks'
import {SANITY_VERSION} from '../../../../version'
import {FreeTrialResponse} from './types'

interface FreeTrialContextProps {
  data: FreeTrialResponse | null
  showDialog: boolean
  showOnLoad: boolean
  /**
   * If the user is seeing the `showOnLoad` popover or modal, and clicks on the pricing button the `showOnClick` modal should be triggered.
   */
  toggleShowContent: (closeAndReOpen?: boolean) => void
}

const FreeTrialContext = createContext<FreeTrialContextProps | undefined>(undefined)

interface FreeTrialProviderProps {
  children: React.ReactNode
}
export const FreeTrialProvider = ({children}: FreeTrialProviderProps) => {
  const [data, setData] = useState<FreeTrialResponse | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showOnLoad, setShowOnLoad] = useState(false)
  const client = useClient({apiVersion: 'vX'})

  useEffect(() => {
    const fetchData = async () => {
      const response = await client.request<FreeTrialResponse | null>({
        url: `/journey/trial?studioVersion=${SANITY_VERSION}`,
      })

      setData(response)
      // Validates if the user has seen the "structure rename modal" before showing this one. To avoid multiple popovers at same time.
      const deskRenameSeen = localStorage.getItem('sanityStudio:desk:renameDismissed') === '1'
      if (deskRenameSeen && response?.showOnLoad) {
        setShowOnLoad(true)
        setShowDialog(true)
      }
    }
    fetchData()
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

export const useFreeTrialContext = (): FreeTrialContextProps => {
  const context = useContext(FreeTrialContext)
  if (!context) {
    throw new Error('useFreeTrial must be used within a FreeTrialProvider')
  }
  return context
}
