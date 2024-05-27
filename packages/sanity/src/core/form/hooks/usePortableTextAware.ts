import {useContext} from 'react'
import {PortableTextAwareContext, type PortableTextAwareContextValue} from 'sanity/_singletons'

/**
 * @internal
 * A hook that provides information about whether if the there is a Portable Text editor parent.
 */
export function usePortableTextAware(): PortableTextAwareContextValue | null {
  return useContext(PortableTextAwareContext)
}
