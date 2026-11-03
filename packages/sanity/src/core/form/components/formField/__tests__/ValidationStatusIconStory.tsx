import {Card} from '@sanity/ui'
import {Flex, Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {StatusIcon} from '../ValidationStatusIcon'

const STATUSES = ['error', 'warning', 'info'] as const

/**
 * Chromatic sentinel for form-field validation glyphs after the Panda CSS
 * token migration: critical / caution / primary badge icon colors on the
 * StatusIcon wrapper. Labels are fixtures; no tooltip is opened.
 */
export function ValidationStatusIconStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 280}}>
        <VStack gap={4}>
          {STATUSES.map((status) => (
            <Flex alignItems="center" gap={3} key={status}>
              <StatusIcon status={status} />
              <Text size={1} as="div" trim={true}>
                {status}
              </Text>
            </Flex>
          ))}
        </VStack>
      </Card>
    </TestWrapper>
  )
}
