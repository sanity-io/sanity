import {Card, Heading, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Container, VStack} from 'ui5'

export const ERROR_TITLE = 'Dev server stopped'
const ERROR_DESCRIPTION =
  'The development server has stopped. You may need to restart it to continue working.'

/**
 * Imported statically by `StudioErrorBoundary`: once the dev server is gone, no chunk can be
 * fetched anymore, so the screen that reports it has to be loaded already.
 */
export default function DevServerStoppedErrorScreen(): ReactNode {
  return (
    <Card
      data-testid="studio-error-screen"
      data-error="Dev server stopped"
      height="fill"
      overflow="auto"
      paddingY={[4, 5, 6, 7]}
      paddingX={4}
      sizing="border"
      tone="critical"
    >
      <Container size={3}>
        <VStack gap={4}>
          <Heading>{ERROR_TITLE}</Heading>

          <Card border radius={2} overflow="auto" padding={4} tone="inherit">
            <VStack gap={4}>
              <Text size={2}>{ERROR_DESCRIPTION}</Text>
            </VStack>
          </Card>
        </VStack>
      </Container>
    </Card>
  )
}
