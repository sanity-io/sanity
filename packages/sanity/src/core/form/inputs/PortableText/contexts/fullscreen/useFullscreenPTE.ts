import {useContext} from 'react'

import {FullscreenPTEContext} from './FullscreenPTEContext'

/**
 * Hook to access fullscreen PTE context
 * @internal
 */
export function useFullscreenPTE() {
  return useContext(FullscreenPTEContext)
}
