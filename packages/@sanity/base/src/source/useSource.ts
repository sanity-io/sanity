import {useContext} from 'react'
import {SourceContext} from './SourceContext'
import {SanitySource} from './types'

export function useSource(): SanitySource {
  const source = useContext(SourceContext)

  if (!source) {
    throw new Error('Source: missing context value')
  }

  return source
}
