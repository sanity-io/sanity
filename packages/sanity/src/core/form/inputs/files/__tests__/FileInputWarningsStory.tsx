import {Card, Flex, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {AccessPolicyBadge} from '../common/AccessPolicyBadge'
import {UploadWarning} from '../common/UploadWarning'
import {InvalidFileWarning} from '../FileInput/InvalidFileWarning'
import {InvalidImageWarning} from '../ImageInput/InvalidImageWarning'

/**
 * Chromatic sentinel for file/image input warning chrome after the ui5 Box
 * migration. The three caution cards share one chrome (Card tone → Flex →
 * Box icon gutter → Stack → ghost Button) and differ only in copy, so they
 * pin the same layout three times over different string lengths; the
 * private-access badge is shrink-wrapped in a centered Flex the way
 * FileActionsMenu renders it. Copy comes from the default studio locale
 * (no timestamps).
 */
export function FileInputWarningsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              invalid image
            </Text>
            <InvalidImageWarning onClearValue={noop} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              invalid file
            </Text>
            <InvalidFileWarning onClearValue={noop} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              stale upload
            </Text>
            <UploadWarning onClearStale={noop} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              access policy (FileActionsMenu row)
            </Text>
            <Flex justify="center" gap={2}>
              <AccessPolicyBadge />
            </Flex>
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
