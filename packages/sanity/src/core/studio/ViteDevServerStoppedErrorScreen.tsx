import {Card, Heading, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Container, VStack} from 'ui5'

export const ERROR_TITLE = 'Dev server stopped'
const ERROR_DESCRIPTION =
  'The development server has stopped. You may need to restart it to continue working.'

/**
 * Imported eagerly by `StudioErrorBoundary`: no chunk can load once the dev server is gone, and
 * the screen is small enough to ship in the production bundle, where it never renders.
 */
export function DevServerStoppedErrorScreen(): ReactNode {
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
