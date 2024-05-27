import {createContext} from 'react'

/** @internal */
export interface PortableTextAwareContextValue {
  hasEditorParent: boolean
}

/**
 * @internal
 * A context that provides information about whether if the there is a Portable Text editor parent.
 */
export const PortableTextAwareContext = createContext<PortableTextAwareContextValue | null>(null)
