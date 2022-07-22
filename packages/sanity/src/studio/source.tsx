import React, {createContext, useContext} from 'react'
import {Source} from '../config'
import {useWorkspace} from './workspace'

export type SourceProviderProps =
  | {source: Source; children?: React.ReactNode}
  | {name: string; children?: React.ReactNode}

const SourceContext = createContext<Source | null>(null)

export function SourceProvider({children, ...props}: SourceProviderProps) {
  const parentSource = useContext(SourceContext)
  const {unstable_sources: sources} = useWorkspace()

  if ('source' in props) {
    const {source} = props
    return <SourceContext.Provider value={source}>{children}</SourceContext.Provider>
  }

  if ('name' in props) {
    const {name} = props
    const source = sources.find((s) => s.name === name)
    if (!source) {
      throw new Error(`Could not find source with name \`${name}\` in current workspace`)
    }
    if (parentSource === source) return <>{children}</>
    return <SourceContext.Provider value={source}>{children}</SourceContext.Provider>
  }

  throw new Error(
    'Invalid props passed into SourceProvider. A `name` or a `source` object is required.'
  )
}

/**
 * @deprecated INTERNAL USE ONLY
 */
export function useSource(): Source {
  const source = useContext(SourceContext)
  if (!source) throw new Error('Could not find `source` context')
  return source
}
