import {useContext} from 'react'
import {PresentationParamsContext} from 'sanity/_singletons'

import {type PresentationParamsContextValue} from './types'

/** @public */
export function usePresentationParams(throwOnMissingContext?: true): PresentationParamsContextValue
/** @public */
export function usePresentationParams(
  throwOnMissingContext: false,
): PresentationParamsContextValue | null
/** @public */
export function usePresentationParams(
  throwOnMissingContext = true,
): PresentationParamsContextValue | null {
  const params = useContext(PresentationParamsContext)

  if (throwOnMissingContext && !params) {
    throw new Error('Presentation params context is missing')
  }

  return params
}
