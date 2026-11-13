import {type ReleaseDocument} from '@sanity/client'
import {Card} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
} from '../../../../__fixtures__/release.fixture'
import {CopyToReleaseMenuGroup} from '../CopyToReleaseMenuGroup'

const RELEASES: ReleaseDocument[] = [
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
]

const noop = () => undefined
const noopAsync = () => Promise.resolve()

/**
 * Chromatic sentinel for the "Copy version to" menu group: the enabled row
 * with a release list behind its submenu, the row whose tooltip explains a
 * missing create permission, and the disabled row. The submenu stays closed
 * (its styled scroll container mounts hidden) and releases are fixtures, so
 * the releases store and the create-release action are never touched.
 */
export function CopyToReleaseMenuGroupStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 320}}>
        <VStack gap={4}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              with releases and drafts
            </Text>
            <Card padding={1} radius={2} shadow={2}>
              <Menu>
                <CopyToReleaseMenuGroup
                  bundleId="rActive"
                  disabled={false}
                  documentType="article"
                  hasCopyToDraftOption
                  hasCreatePermission
                  onCopyToDrafts={noopAsync}
                  onCreateRelease={noop}
                  onCreateVersion={noop}
                  releases={RELEASES}
                />
              </Menu>
            </Card>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              without create permission
            </Text>
            <Card padding={1} radius={2} shadow={2}>
              <Menu>
                <CopyToReleaseMenuGroup
                  bundleId="rActive"
                  disabled={false}
                  documentType="article"
                  hasCreatePermission={false}
                  onCopyToDrafts={noopAsync}
                  onCreateRelease={noop}
                  onCreateVersion={noop}
                  releases={RELEASES}
                />
              </Menu>
            </Card>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              disabled
            </Text>
            <Card padding={1} radius={2} shadow={2}>
              <Menu>
                <CopyToReleaseMenuGroup
                  bundleId="rActive"
                  disabled
                  documentType="article"
                  hasCreatePermission={null}
                  onCopyToDrafts={noopAsync}
                  onCreateRelease={noop}
                  onCreateVersion={noop}
                  releases={[]}
                />
              </Menu>
            </Card>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
