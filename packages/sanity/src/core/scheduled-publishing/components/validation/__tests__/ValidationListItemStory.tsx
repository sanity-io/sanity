import {type ValidationMarker} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {ValidationListItem} from '../ValidationListItem'

const ERROR: ValidationMarker = {
  level: 'error',
  message: 'Title is required',
  path: ['title'],
}

const WARNING: ValidationMarker = {
  level: 'warning',
  message: 'Slug is missing',
  path: ['slug'],
}

const INFO: ValidationMarker = {
  level: 'info',
  message: 'Consider adding a summary',
  path: ['summary'],
}

const LONG_WARNING: ValidationMarker = {
  level: 'warning',
  message:
    'This warning is intentionally long so truncated ellipsis and wrapping can be compared against the full message layout.',
  path: ['description'],
}

/**
 * Chromatic sentinel for scheduled-publishing validation rows: ui5 Box padding
 * around error/warning/info icons plus MenuItem tones (critical / caution /
 * primary). Wrapped in Menu like ValidationInfo. No timestamps. Shared with
 * Storybook via a thin CSF wrapper.
 */
export function ValidationListItemStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              error / warning / info
            </Text>
            <Card padding={1} radius={2} shadow={2}>
              <Menu>
                <ValidationListItem marker={ERROR} onClick={() => null} path="Title" />
                <ValidationListItem marker={WARNING} onClick={() => null} path="Slug" />
                <ValidationListItem marker={INFO} onClick={() => null} path="Summary" />
              </Menu>
            </Card>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              truncated vs full
            </Text>
            <Card padding={1} radius={2} shadow={2}>
              <Menu>
                <ValidationListItem
                  marker={LONG_WARNING}
                  onClick={() => null}
                  path="Description"
                  truncate
                />
                <ValidationListItem marker={LONG_WARNING} onClick={() => null} path="Description" />
              </Menu>
            </Card>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
