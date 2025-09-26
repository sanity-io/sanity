import {useContext} from 'react'
import {DecideParametersContext} from 'sanity/_singletons'

import {type DecideParametersContextValue} from '../_singletons/context/DecideParametersContext'

export function useDecideParameters(): DecideParametersContextValue {
  const context = useContext(DecideParametersContext)

  console.warn('[useDecideParameters] Hook called, context available:', !!context)

  if (!context) {
    console.error('[useDecideParameters] Context is missing!')
    throw new Error('Decide parameters context is missing')
  }

  console.warn(
    '[useDecideParameters] Returning context with decideParameters:',
    context.decideParameters,
  )

  return context
}
