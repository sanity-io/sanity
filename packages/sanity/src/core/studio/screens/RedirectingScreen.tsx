import {DoubleChevronRightIcon} from '@sanity/icons/DoubleChevronRight'
import {Card, Text} from '@sanity/ui'
import {Container, Flex, Box} from 'ui5'

export function RedirectingScreen(props: {reason?: string}) {
  const {reason = 'Redirecting…'} = props

  return (
    <Card height="fill">
      <Flex alignItems="center" height="100%" justifyContent="center" padding={4}>
        <Container size={0}>
          <Card padding={4} radius={2} shadow={1} tone="primary">
            <Flex>
              <Box>
                <Text size={1}>
                  <DoubleChevronRightIcon />
                </Text>
              </Box>
              <Flex flexBasis="0%" flexGrow={1} marginLeft={3} gap={3} flexDirection="column">
                <Text as="h1" size={1} weight="bold">
                  {reason}
                </Text>
              </Flex>
            </Flex>
          </Card>
        </Container>
      </Flex>
    </Card>
  )
}
