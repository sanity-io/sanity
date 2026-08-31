import {Card, Stack, Text} from '@sanity/ui'

import {NotFoundScreen} from '../NotFoundScreen'

const FRAME_STYLE = {height: 220, position: 'relative' as const}
const NOOP = () => undefined

/**
 * Chromatic sentinel for the workspace-not-found boot screen after the ui5
 * Flex migration. Centered caution Card + ghost button depend on Flex
 * alignment — a spacing drift TypeScript will not catch. Copy is hardcoded
 * (no i18n, no timestamps).
 */
export function NotFoundScreenStory() {
  return (
    <Card padding={4}>
      <Stack gap={2}>
        <Text muted size={1} weight="medium">
          workspace not found
        </Text>
        <div style={FRAME_STYLE}>
          <NotFoundScreen onNavigateToDefaultWorkspace={NOOP} />
        </div>
      </Stack>
    </Card>
  )
}
