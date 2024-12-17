import {useContext} from 'react'
import {StructureToolContext} from 'sanity/_singletons'

import {type StructureToolContextValue} from './types'

/** @internal */
export function useStructureTool(): StructureToolContextValue {
  const structureTool = useContext(StructureToolContext)
  if (!structureTool) throw new Error(`StructureTool: missing context value`)

  return structureTool
}
