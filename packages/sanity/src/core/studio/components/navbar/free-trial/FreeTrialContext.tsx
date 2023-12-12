import React, {createContext, useContext, useState, useCallback, useEffect} from 'react'
import {useClient} from '../../../../hooks'
import {SANITY_VERSION} from '../../../../version'
import {FreeTrialResponse} from './types'

interface FreeTrialContextProps {
  data: FreeTrialResponse | null
  showDialog: FreeTrialResponse['showOnLoad'] | null
  toggleShowContent: () => void
}

const FreeTrialContext = createContext<FreeTrialContextProps | undefined>(undefined)

interface FreeTrialProviderProps {
  children: React.ReactNode
}
export const FreeTrialProvider = ({children}: FreeTrialProviderProps) => {
  const [data, setData] = useState<FreeTrialResponse | null>(null)
  const [showDialog, setShowDialog] = useState<FreeTrialResponse['showOnLoad']>(null)
  const [showingOnLoad, setShowingOnLoad] = useState(false)
  const client = useClient({apiVersion: 'vX'})

  const fetchData = async () => {
    const response = (await client.request({
      url: `/journey/trial?studioVersion=${SANITY_VERSION}`,
    })) as unknown as FreeTrialResponse | null

    setData(response)
    // Validates if the user has seen the "structure rename modal" before showing this one. To avoid multiple popovers at same time.
    const deskRenameSeen = localStorage.getItem('sanityStudio:desk:renameDismissed') === '1'
    if (deskRenameSeen && response?.showOnLoad) {
      setShowDialog(response?.showOnLoad)
      setShowingOnLoad(true)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleShowContent = useCallback(() => {
    switch (showDialog) {
      case 'popover':
        setShowDialog(null)
        if (data?.popover?.id && showingOnLoad) {
          client.request({url: `/journey/trial/${data.popover.id}`, method: 'POST'})
        }
        break
      case 'modal':
        setShowDialog(null)
        if (data?.modal?.id && showingOnLoad) {
          client.request({url: `/journey/trial/${data.modal.id}`, method: 'POST'})
        }
        break
      default:
        setShowDialog('modal')
        break
    }
  }, [showDialog, client, data?.popover?.id, data?.modal?.id, showingOnLoad])

  return (
    <FreeTrialContext.Provider value={{data, showDialog, toggleShowContent}}>
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
