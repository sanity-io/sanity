import {useContext} from 'react'
import {StructureToolContext} from './StructureToolContext'
import type {StuctureToolContextValue} from './types'

/** @internal */
export function useStructureTool(): StuctureToolContextValue {
  const structureTool = useContext(StructureToolContext)

  if (!structureTool) throw new Error(`StructureTool: missing context value`)

  return structureTool
}
