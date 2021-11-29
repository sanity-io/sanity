import {useContext} from 'react'
import {DeskToolContext} from './DeskToolContext'
import type {DeskToolContextValue} from './types'

/**
 * @internal
 */
export function useDeskTool(): DeskToolContextValue {
  const deskTool = useContext(DeskToolContext)

  if (!deskTool) {
    throw new Error('DeskTool: missing context value')
  }

  return deskTool
}
