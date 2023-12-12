import React, {createContext, useContext, useState, useCallback, useEffect} from 'react'
import {useClient} from '../../../../hooks'
import {SANITY_VERSION} from '../../../../version'
import {FreeTrialResponse} from './types'

interface FreeTrialContextProps {
  data: FreeTrialResponse | null
  showDialog: boolean
  showOnLoad: boolean
  toggleShowContent: () => void
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

  const fetchData = async () => {
    const response = (await client.request({
      url: `/journey/trial?studioVersion=${SANITY_VERSION}`,
    })) as unknown as FreeTrialResponse | null

    setData(response)
    // Validates if the user has seen the "structure rename modal" before showing this one. To avoid multiple popovers at same time.
    const deskRenameSeen = localStorage.getItem('sanityStudio:desk:renameDismissed') === '1'
    if (deskRenameSeen && response?.showOnLoad) {
      setShowOnLoad(true)
      setShowDialog(true)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleShowContent = useCallback(() => {
    if (showOnLoad) {
      setShowOnLoad(false)
      setShowDialog(false)
      if (data?.showOnLoad?.id) {
        client.request({url: `/journey/trial/${data?.showOnLoad.id}`, method: 'POST'})
      }
    } else {
      setShowDialog((p) => !p)
    }
  }, [client, showOnLoad, data?.showOnLoad?.id])

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
