import {CheckmarkIcon} from '@sanity/icons'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {MenuItem} from '../../../../../ui-components'
import {type WorkspaceSummary} from '../../../../config'
import {probeWorkspaceAuth} from '../../../../store/authStore/probeWorkspaceAuth'
import {STATE_TITLES, WorkspacePreviewIcon} from './WorkspacePreview'

interface WorkspaceMenuItemProps {
  workspace: WorkspaceSummary
  isSelected: boolean
  scrollbarWidth: number
}

/**
 * A single row in the workspace switcher menu. Each row probes
 * `/auth/id` independently, so the list renders immediately on open and
 * resolves badges per-workspace as their probes settle.
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
  const probe = useObservable(probe$)

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
