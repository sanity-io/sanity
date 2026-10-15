import {type ObjectSchemaType, type ValidationMarker} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import StateReasonFailedInfo from '../../scheduleItem/StateReasonFailedInfo'
import {ValidationInfo} from '../ValidationInfo'
import {ValidationList} from '../ValidationList'

const ARTICLE_TYPE = {
  name: 'article',
  title: 'Article',
  jsonType: 'object',
  fields: [
    {name: 'title', type: {name: 'string', title: 'Title'}},
    {name: 'body', type: {name: 'text', title: 'Body'}},
    {name: 'slug', type: {name: 'slug', title: 'Slug'}},
  ],
} as unknown as ObjectSchemaType

const ERROR_MARKERS: ValidationMarker[] = [
  {level: 'error', message: 'Title is required', path: ['title']},
]

const WARNING_MARKERS: ValidationMarker[] = [
  {level: 'warning', message: 'Body is shorter than 50 characters', path: ['body']},
]

const MIXED_MARKERS: ValidationMarker[] = [
  {level: 'error', message: 'Title is required', path: ['title']},
  {level: 'warning', message: 'Body is shorter than 50 characters', path: ['body']},
  {level: 'info', message: 'Slug will be generated from the title', path: ['slug']},
  {
    level: 'error',
    message:
      'This caption is longer than the recommended 160 characters and should wrap instead of overflowing the validation menu.',
    path: ['title'],
  },
]

const FAILED_REASON = 'The document was deleted before the scheduled time.'

export type ScheduledValidationStoryMode = 'list' | 'buttons' | 'failed'

/**
 * Chromatic sentinel for scheduled-publishing validation chrome after the
 * ui5 Container/Flex/VStack migration. Critical/caution/info ValidationList
 * items, ValidationInfo icon tones (including the hidden equal-width
 * placeholder), and the failed-schedule reason menu all mix ui5 spacing
 * with `@sanity/ui` Menu/Text — a combination TypeScript will not catch.
 * Fixture markers and copy only; no live schedules.
 */
function renderMode(mode: ScheduledValidationStoryMode) {
  switch (mode) {
    case 'list':
      return (
        <Card padding={4} style={{maxWidth: 360}}>
          <VStack gap={5}>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                wrapping
              </Text>
              <Menu padding={1}>
                <ValidationList documentType={ARTICLE_TYPE} validation={MIXED_MARKERS} />
              </Menu>
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium">
                truncated
              </Text>
              <Menu padding={1}>
                <ValidationList documentType={ARTICLE_TYPE} truncate validation={MIXED_MARKERS} />
              </Menu>
            </VStack>
          </VStack>
        </Card>
      )
    case 'buttons':
      return (
        <Card padding={4}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              error / warning / hidden
            </Text>
            <Flex alignItems="center" gap={3}>
              <ValidationInfo documentId="article-1" markers={ERROR_MARKERS} type={ARTICLE_TYPE} />
              <ValidationInfo
                documentId="article-1"
                markers={WARNING_MARKERS}
                type={ARTICLE_TYPE}
              />
              <ValidationInfo documentId="article-1" markers={[]} type={ARTICLE_TYPE} />
            </Flex>
          </VStack>
        </Card>
      )
    case 'failed':
      return (
        <Card padding={4}>
          <StateReasonFailedInfo stateReason={FAILED_REASON} />
        </Card>
      )
    default: {
      const exhaustive: never = mode
      return exhaustive
    }
  }
}

export function ScheduledValidationStory(props: {mode: ScheduledValidationStoryMode}) {
  return <TestWrapper schemaTypes={[]}>{renderMode(props.mode)}</TestWrapper>
}
