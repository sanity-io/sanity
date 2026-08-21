import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {
  activeASAPRelease,
  activeScheduledRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
} from '../../../../__fixtures__/release.fixture'
import {type TableRelease} from '../../ReleasesOverview'
import {ReleaseNameCell} from '../ReleaseName'

const CELL_PROPS = {id: 'name', style: {}}

const untitled: TableRelease = {
  ...activeASAPRelease,
  metadata: {...activeASAPRelease.metadata, title: ''},
}

/**
 * Chromatic sentinel for the releases-overview name cell: Box padding around
 * the pin button, ReleaseAvatar, and title. Pin tooltips stay closed. Loading
 * skeletons are omitted (animated). Shared with Storybook via a thin CSF
 * wrapper.
 */
export function ReleaseNameCellStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              active
            </Text>
            <ReleaseNameCell cellProps={CELL_PROPS} datum={activeASAPRelease} sorting={false} />
            <ReleaseNameCell
              cellProps={CELL_PROPS}
              datum={activeScheduledRelease}
              sorting={false}
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              untitled fallback
            </Text>
            <ReleaseNameCell cellProps={CELL_PROPS} datum={untitled} sorting={false} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              archived / published (pin disabled)
            </Text>
            <ReleaseNameCell
              cellProps={CELL_PROPS}
              datum={archivedScheduledRelease}
              sorting={false}
            />
            <ReleaseNameCell cellProps={CELL_PROPS} datum={publishedASAPRelease} sorting={false} />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
