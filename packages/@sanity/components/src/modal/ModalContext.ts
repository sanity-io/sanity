import {createContext} from 'react'

export interface ModalContextValue {
  depth: number
  mount: () => () => void
  size: number
}

export const ModalContext = createContext<ModalContextValue | null>(null)
