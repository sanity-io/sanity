import {useContext} from 'react'
import {DecideParametersContext} from 'sanity/_singletons'

import {type DecideParametersContextValue} from '../_singletons/context/DecideParametersContext'

export function useDecideParameters(): DecideParametersContextValue {
  const context = useContext(DecideParametersContext)

  if (!context) {
    throw new Error('Decide parameters context is missing')
  }

  return context
}
