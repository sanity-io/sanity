import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Card} from '@sanity/ui'

import {type WorkspaceSummary} from '../../../../../config/types'
import {useWorkspaceAuthState, type WorkspaceAuthState} from '../useWorkspaceAuthState'
import {WorkspacePreview} from '../WorkspacePreview'

interface WorkspaceAuthCardProps {
  workspace: WorkspaceSummary
  onSelect: (state: WorkspaceAuthState) => void
}

/**
 * A single workspace card on the login screen. Each card asks its workspace's auth store
 * independently, so the list renders immediately and each row resolves its state on its own.
 *
 * @internal
 */
export function WorkspaceAuthCard({workspace, onSelect}: WorkspaceAuthCardProps) {
  const state = useWorkspaceAuthState(workspace)

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
