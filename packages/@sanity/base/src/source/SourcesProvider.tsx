import React from 'react'
import {SanitySource} from './types'
import {SourcesContext} from './SourcesContext'

export function SourcesProvider(props: {
  children?: React.ReactNode
  sources: SanitySource[]
}): React.ReactElement {
  const {children, sources} = props

  return <SourcesContext.Provider value={sources}>{children}</SourcesContext.Provider>
}
