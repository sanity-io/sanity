import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Card} from '@sanity/ui'

import {type WorkspaceSummary} from '../../../../../config/types'
import {useWorkspaceLoginStatus, type WorkspaceLoginStatus} from '../hooks/useWorkspaceLoginStatus'
import {WorkspacePreview} from '../WorkspacePreview'

interface WorkspaceAuthCardProps {
  workspace: WorkspaceSummary
  onSelect: (state: WorkspaceLoginStatus) => void
}

/**
 * A single workspace card on the login screen. Probes `/auth/id`
 * independently so the list renders immediately and each row resolves
 * its state per-workspace.
 *
 * @internal
 */
export function WorkspaceAuthCard({workspace, onSelect}: WorkspaceAuthCardProps) {
  const state = useWorkspaceLoginStatus(workspace)

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
