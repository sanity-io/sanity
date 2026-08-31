import {Card, Stack, Text} from '@sanity/ui'

import {ErrorMessage} from '../ErrorMessage'

const PATH = [
  {name: 'root', type: 'workspace'},
  {name: 'schema', type: 'schema'},
  {name: 'author', type: 'document'},
] as const

const ERROR = new Error('Unknown type: author')

/**
 * Chromatic sentinel for workspace-loader config errors after the ui5
 * Flex/Box migration. Heading, critical Code card, and path rows all
 * depend on Flex gap plus Box gutters — a mix TypeScript will not catch.
 * Message and path are fixtures; stack is omitted (would be non-deterministic).
 */
export function ErrorMessageStory() {
  return (
    <Card padding={4} style={{maxWidth: 520}}>
      <Stack gap={2}>
        <Text muted size={1} weight="medium">
          workspace loader error
        </Text>
        <ErrorMessage error={ERROR} message="Unknown type: author" path={[...PATH]} />
      </Stack>
    </Card>
  )
}
