import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {CommentBreadcrumbs} from '../CommentBreadcrumbs'

interface CommentBreadcrumbsStoryProps {
  maxLength?: number
  titlePath?: string[]
}

export function CommentBreadcrumbsStory({
  maxLength = 4,
  titlePath = ['Article', 'Body', 'Image'],
}: CommentBreadcrumbsStoryProps) {
  return (
    <Card padding={4}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} as="div" trim={true}>
            short path
          </Text>
          <CommentBreadcrumbs maxLength={maxLength} titlePath={titlePath} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} as="div" trim={true}>
            truncated
          </Text>
          <CommentBreadcrumbs
            maxLength={maxLength}
            titlePath={['Article', 'Body', 'Content', 'Block', 'Image', 'Alt text']}
          />
        </VStack>
      </VStack>
    </Card>
  )
}
