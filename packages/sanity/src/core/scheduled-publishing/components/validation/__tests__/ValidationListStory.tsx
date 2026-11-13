import {type ObjectSchemaType, type ValidationMarker} from '@sanity/types'
import {Card} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {ValidationList} from '../ValidationList'

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

const ARTICLE_TYPE = {
  jsonType: 'object',
  name: 'article',
  fields: [
    {name: 'title', type: {name: 'string', title: 'Title', jsonType: 'string'}},
    {name: 'slug', type: {name: 'slug', title: 'Slug', jsonType: 'object'}},
    {name: 'summary', type: {name: 'text', title: 'Summary', jsonType: 'string'}},
    {name: 'description', type: {name: 'text', title: 'Description', jsonType: 'string'}},
  ],
} as ObjectSchemaType

const NOOP = () => undefined

/**
 * Chromatic sentinel for the scheduled-publishing validation list after the
 * ui5 Container migration. Field titles come from the fixture schema; rows
 * sit in a Menu the way ValidationInfo mounts them. Messages are static.
 * Shared with Storybook via a thin CSF wrapper.
 */
export function ValidationListStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              error / warning / info
            </Text>
            <Card padding={1} radius={2} shadow={2}>
              <Menu>
                <ValidationList
                  documentType={ARTICLE_TYPE}
                  onFocus={NOOP}
                  validation={[ERROR, WARNING, INFO]}
                />
              </Menu>
            </Card>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              truncated vs full
            </Text>
            <Card padding={1} radius={2} shadow={2}>
              <Menu>
                <ValidationList
                  documentType={ARTICLE_TYPE}
                  onFocus={NOOP}
                  truncate
                  validation={[LONG_WARNING]}
                />
                <ValidationList
                  documentType={ARTICLE_TYPE}
                  onFocus={NOOP}
                  validation={[LONG_WARNING]}
                />
              </Menu>
            </Card>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
