import {Card} from '@sanity/ui'
import {route, RouterProvider} from 'sanity/router'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {
  activeASAPRelease,
  activeScheduledRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
} from '../../../../__fixtures__/release.fixture'
import {type InjectedTableProps} from '../../../components/Table/types'
import {type TableRelease} from '../../ReleasesOverview'
import {ReleaseNameCell} from '../ReleaseName'

const CELL_PROPS: InjectedTableProps = {id: 'name', style: {}}

// The cell resolves the release detail address while it renders. The test
// wrapper's router has no release route, so the story provides one.
const releaseRouter = route.create('/', [route.create('/:releaseId')])

const untitled: TableRelease = {
  ...activeASAPRelease,
  metadata: {...activeASAPRelease.metadata, title: ''},
}

const deleted: TableRelease = {...activeASAPRelease, isDeleted: true}

/**
 * Chromatic sentinel for the releases-overview name cell: Box padding around
 * the pin button, ReleaseAvatar, and title, plus the transparent deleted row.
 * Pin / deleted tooltips stay closed. Loading skeletons are omitted
 * (animated). Grid harness for the co-located Storybook CSF file.
 */
export function ReleaseNameCellStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <RouterProvider onNavigate={() => undefined} router={releaseRouter} state={{}}>
        <Card padding={4} style={{maxWidth: 360}}>
          <VStack gap={5}>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                active
              </Text>
              <ReleaseNameCell cellProps={CELL_PROPS} datum={activeASAPRelease} sorting={false} />
              <ReleaseNameCell
                cellProps={CELL_PROPS}
                datum={activeScheduledRelease}
                sorting={false}
              />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                untitled fallback
              </Text>
              <ReleaseNameCell cellProps={CELL_PROPS} datum={untitled} sorting={false} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                archived / published (pin disabled)
              </Text>
              <ReleaseNameCell
                cellProps={CELL_PROPS}
                datum={archivedScheduledRelease}
                sorting={false}
              />
              <ReleaseNameCell
                cellProps={CELL_PROPS}
                datum={publishedASAPRelease}
                sorting={false}
              />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                deleted (transparent card)
              </Text>
              <ReleaseNameCell cellProps={CELL_PROPS} datum={deleted} sorting={false} />
            </VStack>
          </VStack>
        </Card>
      </RouterProvider>
    </TestWrapper>
  )
}
