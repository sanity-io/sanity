import {Stack, Text} from '@sanity/ui'
import {type ReactNode} from 'react'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {PaneLayout} from '../../../components/pane/PaneLayout'
import {UnknownPane} from '../../unknown/UnknownPaneType'
import {ErrorPane} from '../ErrorPane'

function Frame({children}: {children: ReactNode}) {
  return <div style={{height: 200}}>{children}</div>
}

/**
 * Chromatic sentinel for structure pane error and unknown-type chrome
 * after the ui5 Box/Flex migration. Critical vs caution ErrorPane tones
 * and UnknownPane copy for a named type vs a missing type all depend on
 * Box padding against pane header/content — a mix TypeScript will not
 * catch. Copy is locale-fixture only. Each pane is its own layout so
 * collapse thresholds cannot hide a state.
 */
export function StructurePaneErrorsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Stack gap={4} padding={3}>
        <Frame>
          <PaneLayout height="fill">
            <ErrorPane paneKey="error-critical" title="Could not load documents">
              <Text size={1}>The query failed because the dataset is unavailable.</Text>
            </ErrorPane>
          </PaneLayout>
        </Frame>
        <Frame>
          <PaneLayout height="fill">
            <ErrorPane paneKey="error-caution" title="Deprecated pane" tone="caution">
              <Text size={1}>This pane type is no longer supported.</Text>
            </ErrorPane>
          </PaneLayout>
        </Frame>
        <Frame>
          <PaneLayout height="fill">
            <UnknownPane isSelected={false} pane={{type: 'legacyList'}} paneKey="unknown-typed" />
          </PaneLayout>
        </Frame>
        <Frame>
          <PaneLayout height="fill">
            <UnknownPane isSelected pane={{title: 'Orphan'}} paneKey="unknown-missing" />
          </PaneLayout>
        </Frame>
      </Stack>
    </TestWrapper>
  )
}
