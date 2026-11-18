import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {HELP_URL, SerializeError} from '../../../structureBuilder/SerializeError'
import {PaneResolutionError} from '../../../structureResolvers/PaneResolutionError'
import {StructureError} from '../StructureError'

const FRAME_STYLE = {height: 420}
const NOOP = () => undefined

function serializeErrorWithPath(): PaneResolutionError {
  const cause = new SerializeError(
    'List item is missing a title',
    ['root', 'content'],
    'items',
    'list items',
  )
  cause.withHelpUrl(HELP_URL.TITLE_REQUIRED)
  return new PaneResolutionError({
    message: 'List item is missing a title',
    cause,
    helpId: cause.helpId,
  })
}

function serializeErrorMessageOnly(): PaneResolutionError {
  return new PaneResolutionError({
    message: 'Could not resolve structure',
    cause: new SerializeError('Could not resolve structure', [], undefined),
  })
}

/**
 * Chromatic sentinel for the full-page structure error after the ui5
 * Box/Flex/VStack/Link migration. SerializeError as cause hides the stack
 * (which would include `window.location.host`) so the snapshot stays
 * deterministic: path segments with the ➝ separator, docs link, and the
 * reload button. Messages are fixtures (no live structure).
 */
export function StructureErrorStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              serialize error with path
            </Text>
            <div style={FRAME_STYLE}>
              <StructureError error={serializeErrorWithPath()} onReload={NOOP} />
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              serialize error message only
            </Text>
            <div style={FRAME_STYLE}>
              <StructureError error={serializeErrorMessageOnly()} onReload={NOOP} />
            </div>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
