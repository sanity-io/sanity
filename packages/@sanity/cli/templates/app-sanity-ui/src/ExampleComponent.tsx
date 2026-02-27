import {type CurrentUser, useCurrentUser} from '@sanity/sdk-react'
import {Avatar, Card, Container, Flex, Heading, Stack, Text} from '@sanity/ui'

export function ExampleComponent() {
  const user: CurrentUser | null = useCurrentUser()

  return (
    <Container width={1}>
      <Card padding={5} shadow={3} radius={3} marginY={5}>
        <Flex align="center" direction="column" gap={5} marginY={4}>
          <Avatar size={3} src={user?.profileImage} />
          <Heading as="h1">Welcome to your Sanity App, {user?.name}!</Heading>
          <Stack space={4}>
            <Text muted>
              This is an example component, rendered with Sanity UI and the{' '}
              <code>useCurrentUser</code> hook from the Sanity App SDK. You can import and use any
              Sanity UI components and App SDK hooks anywhere in this application.
            </Text>
            <Text muted>
              You can also replace this component with components of your own. Render them in your
              app by importing and using them in your application’s <code>src/App.tsx|jsx</code>{' '}
              file.
            </Text>
            <Text muted>
              Looking for more guidance? See the <a href="https://sanity.io/ui">Sanity UI docs</a>{' '}
              and the <a href="https://reference.sanity.io/_sanity/sdk-react/">Sanity App SDK docs</a>!
            </Text>
          </Stack>
        </Flex>
      </Card>
    </Container>
  )
}
