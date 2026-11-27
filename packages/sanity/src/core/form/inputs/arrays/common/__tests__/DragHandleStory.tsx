import {Card} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Text, Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {DragHandle} from '../DragHandle'

function Row({label, children}: {label: string; children: ReactNode}) {
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium" as="div" trim={true}>
        {label}
      </Text>
      <Flex>{children}</Flex>
    </VStack>
  )
}

/**
 * Chromatic sentinel for the array drag handle after the ui5 Button
 * migration. List vs grid (cursor) and the disabled read-only state.
 * Tooltip stays closed.
 */
export function DragHandleStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 240}}>
        <VStack gap={5}>
          <Row label="list">
            <DragHandle readOnly={false} />
          </Row>
          <Row label="grid">
            <DragHandle $grid readOnly={false} />
          </Row>
          <Row label="read-only">
            <DragHandle readOnly />
          </Row>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
