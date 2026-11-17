import noop from 'lodash-es/noop.js'
import {useMemo} from 'react'
import {ActiveWorkspaceMatcherContext, VisibleWorkspacesContext} from 'sanity/_singletons'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type ActiveWorkspaceMatcherContextValue} from '../../activeWorkspaceMatcher/ActiveWorkspaceMatcherContext'
import {type ConfigErrorClassification} from '../../requestErrors/classify'
import {useWorkspace} from '../../workspace'
import {ConfigErrorScreen} from '../ConfigErrorScreen'
import {type VisibleWorkspacesContextValue} from '../VisibleWorkspacesProvider'
import {createWorkspaceSummary} from './createWorkspaceSummary'

export interface ConfigErrorScreenStoryProps {
  error: ConfigErrorClassification
  projectId?: string
  dataset?: string
  isStaging: boolean
  /**
   * The "Choose another workspace" button is only offered when more than one
   * workspace is visible, so this toggles between a one- and a two-workspace
   * studio.
   */
  multipleWorkspaces: boolean
}

function ConfigErrorScreenInWorkspace(props: ConfigErrorScreenStoryProps) {
  const {error, projectId, dataset, isStaging, multipleWorkspaces} = props
  const workspace = useWorkspace()

  const {active, visible} = useMemo<{
    active: ActiveWorkspaceMatcherContextValue
    visible: VisibleWorkspacesContextValue
  }>(() => {
    const marketing = createWorkspaceSummary(workspace, {
      name: 'marketing',
      title: 'Marketing',
      basePath: '/marketing',
    })
    const docs = createWorkspaceSummary(workspace, {
      name: 'docs',
      title: 'Docs',
      basePath: '/docs',
    })
    return {
      active: {activeWorkspace: marketing, setActiveWorkspace: noop},
      visible: {
        visibleWorkspaces: multipleWorkspaces ? [marketing, docs] : [marketing],
        workspaceAuthStates: {},
      },
    }
  }, [multipleWorkspaces, workspace])

  return (
    <VisibleWorkspacesContext.Provider value={visible}>
      <ActiveWorkspaceMatcherContext.Provider value={active}>
        <ConfigErrorScreen
          error={error}
          projectId={projectId}
          dataset={dataset}
          isStaging={isStaging}
        />
      </ActiveWorkspaceMatcherContext.Provider>
    </VisibleWorkspacesContext.Provider>
  )
}

/**
 * Chromatic sentinel for the project / dataset "not found" config error
 * screens. The visible workspaces are fixtures with no auth probe; the
 * workspace chooser the "Choose another workspace" button opens is not
 * rendered because its cards probe `/auth/id` over the network.
 */
export function ConfigErrorScreenStory(props: ConfigErrorScreenStoryProps) {
  return (
    <TestWrapper schemaTypes={[]}>
      <ConfigErrorScreenInWorkspace {...props} />
    </TestWrapper>
  )
}
