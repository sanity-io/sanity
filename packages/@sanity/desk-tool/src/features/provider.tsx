import React, {useEffect, useMemo, useState} from 'react'
import {DeskToolFeaturesContext} from './context'
import {createDeskToolFeaturesController} from './controller'
import {DeskToolFeatures} from './types'

export function DeskToolFeaturesProvider({children}: {children: React.ReactNode}) {
  const controller = useMemo(() => createDeskToolFeaturesController(), [])
  const [state, setState] = useState<DeskToolFeatures>({reviewChanges: false, splitViews: false})

  useEffect(() => {
    const sub = controller.state$.subscribe(setState)
    return () => sub.unsubscribe()
  }, [controller])

  return (
    <DeskToolFeaturesContext.Provider value={state}>{children}</DeskToolFeaturesContext.Provider>
  )
}
