import {DoubleChevronRightIcon} from '@sanity/icons/DoubleChevronRight'
import {Card, Container, Stack, Text} from '@sanity/ui'
import {Flex, Box} from 'ui5'

export function RedirectingScreen(props: {reason?: string}) {
  const {reason = 'Redirecting…'} = props

  return (
    <Card height="fill">
      <Flex alignItems="center" height="100%" justifyContent="center" padding={4}>
        <Container width={0}>
          <Card padding={4} radius={2} shadow={1} tone="primary">
            <Flex>
              <Box>
                <Text size={1}>
                  <DoubleChevronRightIcon />
                </Text>
              </Box>
              <Stack flex={1} marginLeft={3} gap={3}>
                <Text as="h1" size={1} weight="bold">
                  {reason}
                </Text>
              </Stack>
            </Flex>
          </Card>
        </Container>
      </Flex>
    </Card>
  )
}
