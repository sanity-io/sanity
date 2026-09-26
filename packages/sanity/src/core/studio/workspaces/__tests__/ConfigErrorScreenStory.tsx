import noop from 'lodash-es/noop.js'
import {ActiveWorkspaceMatcherContext, VisibleWorkspacesContext} from 'sanity/_singletons'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type WorkspaceSummary} from '../../../config/types'
import {type ActiveWorkspaceMatcherContextValue} from '../../activeWorkspaceMatcher/ActiveWorkspaceMatcherContext'
import {ConfigErrorScreen, type ConfigErrorScreenProps} from '../ConfigErrorScreen'
import {type VisibleWorkspacesContextValue} from '../VisibleWorkspacesProvider'

// The error views read only `name` (to compare with the active workspace)
// and the list length (to decide whether "Choose another workspace" shows).
// The chooser itself is not rendered: its cards probe `/auth/id` per
// workspace, which is not a fixture-reachable state.
function workspaceSummary(name: string): WorkspaceSummary {
  return {
    type: 'workspace-summary',
    name,
    title: name.charAt(0).toUpperCase() + name.slice(1),
    basePath: `/${name}`,
    projectId: 'ppsg7ml5',
    dataset: name,
  } as unknown as WorkspaceSummary
}

const PRODUCTION = workspaceSummary('production')
const STAGING = workspaceSummary('staging')

const ACTIVE_WORKSPACE: ActiveWorkspaceMatcherContextValue = {
  activeWorkspace: PRODUCTION,
  setActiveWorkspace: noop,
}

const SINGLE_WORKSPACE: VisibleWorkspacesContextValue = {
  visibleWorkspaces: [PRODUCTION],
  workspaceAuthStates: {},
}

const TWO_WORKSPACES: VisibleWorkspacesContextValue = {
  visibleWorkspaces: [PRODUCTION, STAGING],
  workspaceAuthStates: {},
}

interface ConfigErrorScreenStoryProps extends ConfigErrorScreenProps {
  /** With more than one visible workspace the "Choose another workspace" button renders. */
  otherWorkspaces?: boolean
}

/**
 * Chromatic sentinel for the workspace configuration takeover after the ui5
 * Flex/Box migration. Heading, message, optional details card, hint, action
 * button and docs link stack in a 520px Box column centered by Flex — the
 * gutters and the right-aligned docs row are what this pins. Project and
 * dataset IDs are fixtures; no request classification, no Manage link probe.
 */
export function ConfigErrorScreenStory(props: ConfigErrorScreenStoryProps) {
  const {otherWorkspaces = false, ...screenProps} = props

  return (
    <TestWrapper schemaTypes={[]}>
      <VisibleWorkspacesContext.Provider
        value={otherWorkspaces ? TWO_WORKSPACES : SINGLE_WORKSPACE}
      >
        <ActiveWorkspaceMatcherContext.Provider value={ACTIVE_WORKSPACE}>
          <ConfigErrorScreen {...screenProps} />
        </ActiveWorkspaceMatcherContext.Provider>
      </VisibleWorkspacesContext.Provider>
    </TestWrapper>
  )
}
