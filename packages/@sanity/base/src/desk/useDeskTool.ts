import {useContext} from 'react'
import {DeskToolContext, DeskToolContextValue} from './DeskToolContext'

export function useDeskTool(): DeskToolContextValue {
  const deskTool = useContext(DeskToolContext)

  if (!deskTool) throw new Error('DeskTool: missing context value')

  return deskTool
}
