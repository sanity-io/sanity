import {useContext} from 'react'
import {StudioContext, StudioContextValue} from './StudioContext'

export function useStudio(): StudioContextValue {
  const studio = useContext(StudioContext)

  if (!studio) {
    throw new Error('Studio: missing context value')
  }

  return studio
}
