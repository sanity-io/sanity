import {useContext} from 'react'

import {IsLastPaneContext} from './IsLastPaneContext'

/**
 * @internal
 * @hidden
 */
export function useIsLastPane(): boolean {
  return useContext(IsLastPaneContext)
}
