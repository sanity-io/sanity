import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {MentionsMenu} from '../MentionsMenu'

/**
 * Chromatic sentinel for the ui5 Box empty-state padding on MentionsMenu.
 * The populated path renders MentionsMenuItem (useUser + skeleton) and is
 * skipped. Grid harness for the co-located Storybook CSF file.
 */
export function MentionsMenuStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 280}}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            no users
          </Text>
          <MentionsMenu loading={false} onSelect={() => null} options={[]} />
        </VStack>
      </Card>
    </TestWrapper>
  )
}
