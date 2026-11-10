import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {type MouseEvent} from 'react'

import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {type WorkspaceSummary} from '../../../../config/types'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher/useActiveWorkspace'
import {useWorkspaceLoginStatus} from './hooks/useWorkspaceLoginStatus'
import {STATE_TITLES, WorkspacePreviewIcon} from './WorkspacePreview'

interface WorkspaceMenuItemProps {
  workspace: WorkspaceSummary
  isSelected: boolean
  scrollbarWidth: number
}

/**
 * A single row in the workspace switcher menu. Each row asks its workspace's auth store on its
 * own: the list renders instantly on open, badges fill in as the answers arrive. Requests go out
 * when the menu opens, or earlier when hovering or focusing the menu button preloads them (see
 * `WorkspaceMenuButton`). A closed menu that was never hovered sends none.
 *
 * @internal
 */
export function WorkspaceMenuItem({workspace, isSelected, scrollbarWidth}: WorkspaceMenuItemProps) {
  const state = useWorkspaceLoginStatus(workspace)
  const {setActiveWorkspace} = useActiveWorkspace()

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // The Dashboard renders every workspace in its own iframe. Its bridge prevents the default of a
    // click on another workspace's link and opens that workspace's iframe, so don't also switch here.
    if (event.defaultPrevented) return

    if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
      return
    }

    event.preventDefault()
    setActiveWorkspace(workspace.name)
  }

  return (
    <MenuItem
      as="a"
      href={workspace.basePath}
      onClick={handleClick}
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
