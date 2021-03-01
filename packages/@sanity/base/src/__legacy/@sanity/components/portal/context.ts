import {createContext} from 'react'
import {defaultContextValue} from './defaultContextValue'

export interface PortalContextInterface {
  element: HTMLElement
}

export const PortalContext = createContext<PortalContextInterface>(defaultContextValue)
