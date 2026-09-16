import {Card, Stack, Text} from '@sanity/ui'

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
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            no users
          </Text>
          <MentionsMenu loading={false} onSelect={NOOP} options={[]} />
        </Stack>
      </Card>
    </TestWrapper>
  )
}
