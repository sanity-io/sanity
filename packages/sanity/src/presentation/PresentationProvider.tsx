import {type FunctionComponent, type PropsWithChildren, useMemo} from 'react'
import {PresentationContext} from 'sanity/_singletons'

import {
  type PresentationContextValue,
  type PresentationNavigate,
  type PresentationParamsContextValue,
  type PresentationSearchParams,
  type StructureDocumentPaneParams,
} from './types'

export const PresentationProvider: FunctionComponent<
  PropsWithChildren<{
    devMode: boolean
    name: string
    navigate: PresentationNavigate
    params: PresentationParamsContextValue
    searchParams: PresentationSearchParams
    structureParams: StructureDocumentPaneParams
  }>
> = function (props) {
  const {children, devMode, name, navigate, params, searchParams, structureParams} = props

  const context = useMemo<PresentationContextValue>(
    () => ({
      devMode,
      name,
      navigate,
      params,
      searchParams,
      structureParams,
    }),
    [devMode, name, navigate, params, searchParams, structureParams],
  )

  return <PresentationContext.Provider value={context}>{children}</PresentationContext.Provider>
}
