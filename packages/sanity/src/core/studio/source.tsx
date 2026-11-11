import {type ReactNode, useContext} from 'react'
import {SourceContext} from 'sanity/_singletons'

import {type Source} from '../config/types'
import {getWorkspaceSource} from '../config/workspaceSource'
import {useWorkspace} from './workspace'

/** @internal */
export type SourceProviderProps =
  | {source: Source; children?: ReactNode}
  | {name: string; children?: ReactNode}

/** @internal */
export function SourceProvider({children, ...props}: SourceProviderProps) {
  const parentSource = useContext(SourceContext)
  const workspace = useWorkspace()

  if ('source' in props) {
    const {source} = props
    return <SourceContext.Provider value={source}>{children}</SourceContext.Provider>
  }

  if ('name' in props) {
    const {name} = props
    // A workspace has a single source, so a name can only match that one.
    const workspaceSource = getWorkspaceSource(workspace)
    const source = workspaceSource.name === name ? workspaceSource : undefined
    if (!source) {
      throw new Error(`Could not find source with name \`${name}\` in current workspace`)
    }
    if (parentSource === source) return <>{children}</>

    return <SourceContext.Provider value={source}>{children}</SourceContext.Provider>
  }

  throw new Error(
    'Invalid props passed into SourceProvider. A `name` or a `source` object is required.',
  )
}

/**
 * @internal
 * @deprecated INTERNAL USE ONLY
 */
export function useSource(): Source {
  const source = useContext(SourceContext)
  if (!source) throw new Error('Could not find `source` context')
  return source
}
