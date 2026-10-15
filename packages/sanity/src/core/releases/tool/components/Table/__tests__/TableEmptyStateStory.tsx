import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TableEmptyState} from '../TableEmptyState'
import {TableLayout} from '../TableLayout'

const EMPTY_FRAME_STYLE = {height: 220}

function StaticHeader() {
  return (
    <thead>
      <tr>
        <th>
          <Text muted size={1} weight="semibold">
            Title
          </Text>
        </th>
        <th>
          <Text muted size={1} weight="semibold">
            When
          </Text>
        </th>
      </tr>
    </thead>
  )
}

function CustomEmptyState() {
  return (
    <Text muted size={1}>
      No matching releases
    </Text>
  )
}

/**
 * Chromatic sentinel for the releases table empty row (Card rendered as a
 * table row): string copy vs a custom empty-state component, both
 * mounted in TableLayout's empty grid (header + filling tbody). The populated
 * table is already snapshotted by Table.browser.test.tsx; this is the path
 * that test never takes. Copy is fixture-only (no timestamps, no live data).
 */
export function TableEmptyStateStory() {
  return (
    <Card padding={4}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            string empty state
          </Text>
          <div style={EMPTY_FRAME_STYLE}>
            <TableLayout
              header={<StaticHeader />}
              isEmptyState
              content={<TableEmptyState colSpan={2} emptyState="No documents" />}
            />
          </div>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            component empty state
          </Text>
          <div style={EMPTY_FRAME_STYLE}>
            <TableLayout
              header={<StaticHeader />}
              isEmptyState
              content={<TableEmptyState colSpan={2} emptyState={CustomEmptyState} />}
            />
          </div>
        </VStack>
      </VStack>
    </Card>
  )
}
