import {useContext} from 'react'

import {FormPathsCallbacksContext} from './FormPathCallbacksProvider'

export function useFormPathCallbacks() {
  return useContext(FormPathsCallbacksContext)
}
