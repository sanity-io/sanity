import {type ReactNode, useContext} from 'react'
import {ConfigErrorContext} from 'sanity/_singletons'

import {useActiveWorkspace} from '../activeWorkspaceMatcher'
import {ConfigErrorScreen} from './ConfigErrorScreen'

/**
 * Renders the config-error takeover ({@link ConfigErrorScreen}) when
 * `WorkspacesProvider` has detected a missing project/dataset, otherwise
 * renders its children.
 *
 * It sits below `ActiveWorkspaceMatcher` (the error is surfaced up through
 * `ConfigErrorContext`) precisely so the screen can use the same
 * workspace-switcher hooks the auth screens use — `useVisibleWorkspaces`
 * and `useActiveWorkspace` are only available here.
 *
 * The error is shown only while the active workspace is the one that
 * failed. `WorkspacesProvider` latches `configError` for the lifetime of
 * the mount, so without this check switching to a healthy workspace (via
 * the screen's "Choose another workspace" button, which is a router push,
 * not a reload) would keep the error up.
 *
 * @internal
 */
export function ConfigErrorGate({children}: {children: ReactNode}): ReactNode {
  const configError = useContext(ConfigErrorContext)
  const {activeWorkspace} = useActiveWorkspace()

  const isActiveWorkspaceFailing =
    configError !== null &&
    activeWorkspace.projectId === configError.projectId &&
    activeWorkspace.dataset === configError.dataset

  if (configError && isActiveWorkspaceFailing) {
    return (
      <ConfigErrorScreen
        error={configError.error}
        projectId={configError.projectId}
        dataset={configError.dataset}
        isStaging={configError.isStaging}
      />
    )
  }
  return children
}
