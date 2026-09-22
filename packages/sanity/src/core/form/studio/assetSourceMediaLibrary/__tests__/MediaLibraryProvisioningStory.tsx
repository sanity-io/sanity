import {type SanityClient} from '@sanity/client'
import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {throwError} from 'rxjs'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {EnsureMediaLibrary} from '../shared/EnsureMediaLibrary'
import {MediaLibraryProvider} from '../shared/MediaLibraryProvider'

const inactiveClient = createMockSanityClient({
  requests: {
    '/projects/test': {organizationId: 'fixture-organization'},
    '/media-libraries?organizationId=fixture-organization': {data: []},
  },
}) as unknown as SanityClient

const unexpectedErrorClient = createMockSanityClient()
unexpectedErrorClient.observable.request = () =>
  throwError(() => new Error('Fixture media service unavailable'))

function UnexpectedErrorFixture() {
  return (
    <TestWrapper client={unexpectedErrorClient as unknown as SanityClient} schemaTypes={[]}>
      <MediaLibraryProvider projectId="test">
        <Text>Media library content</Text>
      </MediaLibraryProvider>
    </TestWrapper>
  )
}

/**
 * Chromatic sentinel for media-library provisioning states touched by the
 * misc form Stack migration. Both clients are local deterministic fixtures:
 * one returns no libraries and one returns a fixed unexpected error.
 */
export function MediaLibraryProvisioningStory() {
  return (
    <Card padding={4} style={{maxWidth: 640}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            no media library provisioned
          </Text>
          <TestWrapper client={inactiveClient} schemaTypes={[]}>
            <EnsureMediaLibrary
              mediaLibraryInfo={{from: 'project', projectId: 'test'}}
              onSetMediaLibraryIds={noop}
            />
          </TestWrapper>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            unexpected provisioning error
          </Text>
          <UnexpectedErrorFixture />
        </Stack>
      </Stack>
    </Card>
  )
}
