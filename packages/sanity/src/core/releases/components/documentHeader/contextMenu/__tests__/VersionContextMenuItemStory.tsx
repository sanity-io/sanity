import {type ReleaseDocument} from '@sanity/client'
import {Card, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {MenuItem} from '../../../../../../ui-components/menuItem/MenuItem'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
  scheduledRelease,
} from '../../../../__fixtures__/release.fixture'
import {VersionContextMenuItem} from '../VersionContextMenuItem'

const untitledRelease: ReleaseDocument = {
  ...activeASAPRelease,
  metadata: {...activeASAPRelease.metadata, title: ''},
}

const scheduledWithoutDate: ReleaseDocument = {
  ...activeScheduledRelease,
  metadata: {...activeScheduledRelease.metadata, intendedPublishAt: undefined},
}

const ROWS: {label: string; release: ReleaseDocument; selected?: boolean}[] = [
  {label: 'asap', release: activeASAPRelease},
  {label: 'selected asap', release: activeASAPRelease, selected: true},
  {label: 'undecided', release: activeUndecidedRelease},
  {label: 'scheduled (active, dated)', release: activeScheduledRelease},
  {label: 'scheduled (locked)', release: scheduledRelease},
  {label: 'scheduled without a date', release: scheduledWithoutDate},
  {label: 'untitled fallback', release: untitledRelease},
]

/**
 * Chromatic sentinel for the copy-to-release menu row: the release avatar
 * beside a two-line title / timing column, with the lock icon on a release
 * that is already scheduled, plus a selected row so the muted timing line
 * follows the menu card tone. Fixture dates sit far enough in the past that
 * the relative formatter always falls back to a plain locale date. The
 * selected row uses an asap release so its subtitle is the static ASAP
 * label rather than a formatted date. Grid harness for the co-located
 * Storybook CSF file.
 */
export function VersionContextMenuItemStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 320}}>
        <VStack gap={4}>
          {ROWS.map(({label, release, selected}) => (
            <VStack key={label} gap={2}>
              <Text muted size={1} weight="medium">
                {label}
              </Text>
              <Card padding={1} radius={2} shadow={2}>
                <Menu>
                  <MenuItem
                    as="a"
                    selected={selected}
                    renderMenuItem={() => <VersionContextMenuItem release={release} />}
                  />
                </Menu>
              </Card>
            </VStack>
          ))}
        </VStack>
      </Card>
    </TestWrapper>
  )
}
