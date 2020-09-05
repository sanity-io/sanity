import {createContext} from 'react'

export interface PortalContextInterface {
  element: HTMLElement
}

export const PortalContext = createContext<PortalContextInterface | null>(null)
