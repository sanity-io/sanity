import {CheckmarkIcon} from '@sanity/icons/Checkmark'

import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {type WorkspaceSummary} from '../../../../config/types'
import {useWorkspaceAuthState} from './useWorkspaceAuthState'
import {STATE_TITLES, WorkspacePreviewIcon} from './WorkspacePreview'

interface WorkspaceMenuItemProps {
  workspace: WorkspaceSummary
  isSelected: boolean
  scrollbarWidth: number
}

/**
 * A single row in the workspace switcher menu. Each row asks its workspace's auth store on its
 * own: the list renders instantly on open, badges fill in as the answers arrive. No request goes
 * out while the menu is closed (see `useWorkspaceAuthState`).
 *
 * @internal
 */
export function WorkspaceMenuItem({workspace, isSelected, scrollbarWidth}: WorkspaceMenuItemProps) {
  const state = useWorkspaceAuthState(workspace)

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
