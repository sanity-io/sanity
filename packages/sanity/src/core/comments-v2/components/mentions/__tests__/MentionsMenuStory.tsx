import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {commentsUsEnglishLocaleBundle} from '../../../i18n'
import {MentionsMenu} from '../MentionsMenu'

const NOOP = () => undefined

/**
 * Chromatic sentinel for the comments-v2 mentions empty state after the
 * ui5 Box padding migration. The populated path renders MentionsMenuItem
 * (useUser + skeleton) and is skipped. Copy is locale-fixture only.
 */
export function MentionsMenuStory() {
  return (
    <TestWrapper i18nBundles={[commentsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 280}}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            no users
          </Text>
          <MentionsMenu loading={false} onSelect={NOOP} options={[]} />
        </VStack>
      </Card>
    </TestWrapper>
  )
}
