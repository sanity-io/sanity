import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {MentionsMenu} from '../MentionsMenu'

/**
 * Chromatic sentinel for the ui5 Box empty-state padding on MentionsMenu.
 * The populated path renders MentionsMenuItem (useUser + skeleton) and is
 * skipped. Shared with the co-located Storybook CSF file.
 */
export function MentionsMenuStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 280}}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            no users
          </Text>
          <MentionsMenu loading={false} onSelect={() => null} options={[]} />
        </Stack>
      </Card>
    </TestWrapper>
  )
}
