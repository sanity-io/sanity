import {use} from 'react'
import {PresentationContext} from 'sanity/_singletons'

import {type PresentationContextValue} from './types'

export function usePresentationTool(throwOnMissingContext?: true): PresentationContextValue
export function usePresentationTool(throwOnMissingContext: false): PresentationContextValue | null
export function usePresentationTool(throwOnMissingContext = true): PresentationContextValue | null {
  const presentation = use(PresentationContext)

  if (throwOnMissingContext && !presentation) {
    throw new Error('Presentation context is missing')
  }

  return presentation
}
