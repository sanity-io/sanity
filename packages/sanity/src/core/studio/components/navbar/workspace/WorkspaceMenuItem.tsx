import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {type WorkspaceSummary} from '../../../../config/types'
import {probeWorkspaceAuth} from '../../../../store/authStore/probeWorkspaceAuth'
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
 *
 * The `null` initial value is load-bearing:
 * - Closed menus keep their items mounted (`<Activity>`, @sanity/ui v4).
 * - Without an initial value, react-rx subscribes during that hidden
 *   render — putting the `/auth/id` probes on the studio boot path.
 * - With it, the probe first fires on reveal (or via the hover/focus
 *   preload on the menu button).
 *
 * @internal
 */
export function WorkspaceMenuItem({workspace, isSelected, scrollbarWidth}: WorkspaceMenuItemProps) {
  const probe$ = useMemo(
    () =>
      probeWorkspaceAuth({
        projectId: workspace.projectId,
        dataset: workspace.dataset,
        apiHost: workspace.apiHost,
      }),
    [workspace.apiHost, workspace.dataset, workspace.projectId],
  )
  const probe = useObservable(probe$, null)

  const state: keyof typeof STATE_TITLES = !probe
    ? 'loading'
    : probe.authenticated
      ? 'logged-in'
      : workspace.auth.LoginComponent
        ? 'logged-out'
        : 'no-access'

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
      }}
      __unstable_space={0}
    />
  )
}
