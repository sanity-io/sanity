import {use} from 'react'
import {FullscreenPTEContext} from 'sanity/_singletons'

/**
 * Hook to access fullscreen PTE context
 * @internal
 */
export function useFullscreenPTE() {
  return use(FullscreenPTEContext)
}
