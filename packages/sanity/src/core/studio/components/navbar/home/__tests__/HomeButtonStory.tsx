import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {ActiveWorkspaceMatcherContext} from 'sanity/_singletons'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {createWorkspaceSummaries} from '../../__tests__/workspaceSummaryFixtures'
import {HomeButton} from '../HomeButton'

const [ACTIVE_WORKSPACE] = createWorkspaceSummaries([
  {name: 'default', title: 'Test Studio', projectId: 'test', dataset: 'test'},
])
const ACTIVE_WORKSPACE_MATCHER = {activeWorkspace: ACTIVE_WORKSPACE, setActiveWorkspace: noop}

/**
 * Chromatic sentinel for the navbar home control: a 25px rounded Sanity UI
 * Card wrapping a ui5 Flex that centres the workspace icon. Distinct from
 * StudioLogo (the title text) and WorkspacePreview (the login / switcher
 * row). The mock workspace uses the auto-generated default icon, so the
 * snapshot is fixture-only.
 */
export function HomeButtonStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <ActiveWorkspaceMatcherContext.Provider value={ACTIVE_WORKSPACE_MATCHER}>
        <Card padding={4} style={{maxWidth: 240}}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              navbar home mark
            </Text>
            <HomeButton />
          </VStack>
        </Card>
      </ActiveWorkspaceMatcherContext.Provider>
    </TestWrapper>
  )
}
