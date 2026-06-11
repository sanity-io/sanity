import {ChevronRightIcon} from '@sanity/icons'
import {Card} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {type WorkspaceSummary} from '../../../../../config'
import {probeWorkspaceAuth} from '../../../../../store/authStore/probeWorkspaceAuth'
import {WorkspacePreview} from '../WorkspacePreview'

interface WorkspaceAuthCardProps {
  workspace: WorkspaceSummary
  onSelect: (state: 'loading' | 'logged-in' | 'logged-out' | 'no-access') => void
}

/**
 * A single workspace card on the login screen. Probes `/auth/id`
 * independently so the list renders immediately and each row resolves
 * its state per-workspace.
 *
 * @internal
 */
export function WorkspaceAuthCard({workspace, onSelect}: WorkspaceAuthCardProps) {
  const probe$ = useMemo(
    () =>
      probeWorkspaceAuth({
        projectId: workspace.projectId,
        dataset: workspace.dataset,
        apiHost: workspace.apiHost,
      }),
    [workspace.apiHost, workspace.dataset, workspace.projectId],
  )
  const probe = useObservable(probe$)

  const state: 'loading' | 'logged-in' | 'logged-out' | 'no-access' = !probe
    ? 'loading'
    : probe.authenticated
      ? 'logged-in'
      : workspace.auth.LoginComponent
        ? 'logged-out'
        : 'no-access'

  return (
    <Card as="button" radius={2} padding={2} onClick={() => onSelect(state)}>
      <WorkspacePreview
        icon={workspace?.icon}
        iconRight={ChevronRightIcon}
        state={state}
        subtitle={workspace?.subtitle}
        title={workspace?.title || workspace.name}
      />
    </Card>
  )
}
