import {useContext} from 'react'
import {WorkspacesContext} from 'sanity/_singletons'

import {type WorkspaceSummary} from '../../config'

/** @internal */
export function useWorkspaces(): WorkspaceSummary[] {
  const workspaces = useContext(WorkspacesContext)
  if (!workspaces) throw new Error('Could not find `workspaces` context')
  return workspaces
}
