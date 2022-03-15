import {useContext} from 'react'
import {SanitySource} from './types'
import {SourcesContext} from './SourcesContext'

export function useSources(): SanitySource[] {
  return useContext(SourcesContext)
}
