import {createContext} from 'react'
import {StructureContext} from './structureBuilder'
import {DeskToolFeatures, UnresolvedPaneNode} from './types'

export interface DeskToolContextValue {
  features: DeskToolFeatures
  layoutCollapsed: boolean
  setLayoutCollapsed: (layoutCollapsed: boolean) => void

  rootPaneNode: UnresolvedPaneNode
  structureContext: StructureContext
}

export const DeskToolContext = createContext<DeskToolContextValue | null>(null)
