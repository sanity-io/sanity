import {use} from 'react'
import {StructureToolContext} from 'sanity/_singletons'

import {type StructureToolContextValue} from './types'

/** @internal */
export function useStructureTool(): StructureToolContextValue {
  const structureTool = use(StructureToolContext)
  if (!structureTool) throw new Error(`StructureTool: missing context value`)

  return structureTool
}
