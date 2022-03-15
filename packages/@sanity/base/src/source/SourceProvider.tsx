import React, {useContext} from 'react'
import {SourceContext} from './SourceContext'
import {useSources} from './useSources'

export function SourceProvider(props: {
  children?: React.ReactNode
  name?: string
}): React.ReactElement {
  const {children, name: nameProp} = props
  const sources = useSources()
  const parentSource = useContext(SourceContext)
  const defaultSource = parentSource || sources.find((s) => s.default) || sources[0]
  const name = nameProp || defaultSource?.name

  if (!name) {
    throw new Error(`SourceProvider: no source name provided`)
  }

  const source = name ? sources.find((s) => s.name === name) : defaultSource

  if (!source) {
    throw new Error(`SourceProvider: source not found: ${name}`)
  }

  return <SourceContext.Provider value={source}>{children}</SourceContext.Provider>
}
