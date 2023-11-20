import {useContext} from 'react'
import {ScratchPadContext, ScratchPadContextValue} from '../context/ScratchPadProvider'

export function useScratchPad(): ScratchPadContextValue {
  const ctx = useContext(ScratchPadContext)

  if (!ctx) {
    throw new Error('useScratchPad must be used within a ScratchPadProvider')
  }

  return ctx
}
