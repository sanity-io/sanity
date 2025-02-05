import {type FunctionComponent, type PropsWithChildren, useMemo} from 'react'
import {PresentationParamsContext} from 'sanity/_singletons'

import {type PresentationParamsContextValue} from './types'

export const PresentationParamsProvider: FunctionComponent<
  PropsWithChildren<{
    params: PresentationParamsContextValue
  }>
> = function (props) {
  const {children, params} = props

  const context = useMemo<PresentationParamsContextValue>(() => params, [params])

  return (
    <PresentationParamsContext.Provider value={context}>
      {children}
    </PresentationParamsContext.Provider>
  )
}
