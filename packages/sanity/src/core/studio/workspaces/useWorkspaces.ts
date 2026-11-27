import {use} from 'react'
import {WorkspacesContext} from 'sanity/_singletons'

import {type WorkspaceSummary} from '../../config/types'

/** @internal */
export function useWorkspaces(): WorkspaceSummary[] {
  const workspaces = use(WorkspacesContext)
  if (!workspaces) throw new Error('Could not find `workspaces` context')
  return workspaces
}
