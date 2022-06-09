import {useContext} from 'react'
import {DeskToolContext} from './DeskToolContext'
import {DeskToolContextValue} from './types'

export function useDeskTool(): DeskToolContextValue {
  const deskTool = useContext(DeskToolContext)

  if (!deskTool) throw new Error(`DeskTool: missing context value`)

  return deskTool
}
