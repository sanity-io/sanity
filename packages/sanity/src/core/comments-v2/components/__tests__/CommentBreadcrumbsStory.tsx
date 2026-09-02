import {Card, Stack, Text} from '@sanity/ui'

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
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1}>
            short path
          </Text>
          <CommentBreadcrumbs maxLength={maxLength} titlePath={titlePath} />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1}>
            truncated
          </Text>
          <CommentBreadcrumbs
            maxLength={maxLength}
            titlePath={['Article', 'Body', 'Content', 'Block', 'Image', 'Alt text']}
          />
        </Stack>
      </Stack>
    </Card>
  )
}
