import {CheckmarkIcon} from '@sanity/icons/Checkmark'

import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {type WorkspaceSummary} from '../../../../config/types'
import {useWorkspaceLoginStatus} from './hooks/useWorkspaceLoginStatus'
import {STATE_TITLES, WorkspacePreviewIcon} from './WorkspacePreview'

interface WorkspaceMenuItemProps {
  workspace: WorkspaceSummary
  isSelected: boolean
  scrollbarWidth: number
}

/**
 * A single row in the workspace switcher menu. Each row probes `/auth/id`
 * on its own: the list renders instantly on open, badges fill in as the
 * probes settle.
 * No probe goes out while the menu is closed (see `useWorkspaceLoginStatus`).
 *
 * @internal
 */
export function WorkspaceMenuItem({workspace, isSelected, scrollbarWidth}: WorkspaceMenuItemProps) {
  const state = useWorkspaceLoginStatus(workspace)

  return (
    <MenuItem
      as="a"
      href={workspace.basePath}
      badgeText={STATE_TITLES[state] || undefined}
      iconRight={isSelected ? CheckmarkIcon : undefined}
      pressed={isSelected}
      preview={<WorkspacePreviewIcon icon={workspace.icon} size="small" />}
      selected={isSelected}
      __unstable_subtitle={workspace.subtitle}
      text={workspace?.title || workspace.name}
      style={{
        marginLeft: '1rem',
        marginRight: `calc(1.25rem - ${scrollbarWidth}px)`,
        flexShrink: 0,
      }}
      __unstable_space={0}
    />
  )
}
