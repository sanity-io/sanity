import {useContext} from 'react'

import {TreeEditingEnabledContext} from './TreeEditingEnabledContext'
import {type TreeEditingEnabledContextValue} from './types'

export function useTreeEditingEnabled(): TreeEditingEnabledContextValue {
  return useContext(TreeEditingEnabledContext)
}
