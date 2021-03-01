import {useContext} from 'react'
import {BoundaryElementContext} from './BoundaryElementContext'

export function useBoundaryElement(): HTMLElement | null {
  return useContext(BoundaryElementContext)
}
