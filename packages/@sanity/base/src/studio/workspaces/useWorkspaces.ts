import {useContext} from 'react'
import {WorkspaceSummary} from '../../config'
import {WorkspacesContext} from './WorkspacesContext'

export function useWorkspaces(): WorkspaceSummary[] {
  const workspaces = useContext(WorkspacesContext)
  if (!workspaces) throw new Error('Could not find `workspaces` context')
  return workspaces
}
