import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {AccessPolicyBadge} from '../common/AccessPolicyBadge'
import {UploadWarning} from '../common/UploadWarning'
import {InvalidFileWarning} from '../FileInput/InvalidFileWarning'
import {InvalidImageWarning} from '../ImageInput/InvalidImageWarning'

/**
 * Chromatic sentinel for file/image input warning chrome after the ui5 Box
 * migration. Caution InvalidImage/File/Upload cards and the private-access
 * badge all pair Box icon padding with Card tones — a mix a type-check will
 * not catch. Copy comes from the default studio locale (no timestamps).
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
            <InvalidImageWarning onClearValue={() => null} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              invalid file
            </Text>
            <InvalidFileWarning onClearValue={() => null} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              stale upload
            </Text>
            <UploadWarning onClearStale={() => null} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              access policy
            </Text>
            <AccessPolicyBadge />
            <AccessPolicyBadge hideBackground />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
