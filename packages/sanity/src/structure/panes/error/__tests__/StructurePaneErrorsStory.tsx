import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {UnknownPane} from '../../unknown/UnknownPaneType'
import {ErrorPane} from '../ErrorPane'

const FRAME_STYLE = {height: 220}

/**
 * Chromatic sentinel for structure pane error chrome after the ui5 Box
 * migration. Critical ErrorPane tone plus UnknownPane missing/unknown type
 * copy all pair Box padding with PaneHeader — a mix TypeScript will not
 * catch. Copy is locale-fixture only (no stack traces or timestamps).
 */
export function StructurePaneErrorsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              error pane
            </Text>
            <div style={FRAME_STYLE}>
              <ErrorPane paneKey="error-pane" title="Could not resolve pane">
                <Text muted size={1}>
                  The structure node failed to load.
                </Text>
              </ErrorPane>
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              unknown pane type
            </Text>
            <div style={FRAME_STYLE}>
              <UnknownPane isSelected pane={{type: 'customChart'}} paneKey="unknown-type" />
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              missing pane type
            </Text>
            <div style={FRAME_STYLE}>
              <UnknownPane isSelected pane={{id: 'orphan'}} paneKey="missing-type" />
            </div>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
