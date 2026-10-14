import {DoubleChevronRightIcon} from '@sanity/icons/DoubleChevronRight'
import {Card} from '@sanity/ui'
import {Text, Container, Flex, Box, Icon} from 'ui5'

export function RedirectingScreen(props: {reason?: string}) {
  const {reason = 'Redirecting…'} = props

  return (
    <Card height="fill">
      <Flex alignItems="center" height="100%" justifyContent="center" padding={4}>
        <Container size={0}>
          <Card padding={4} radius={2} shadow={1} tone="primary">
            <Flex>
              <Icon
                size={1}
                icon={DoubleChevronRightIcon}
                style={{color: 'var(--card-icon-color)', margin: '-0.375rem'}}
              />
              <Flex flexGrow={1} marginLeft={3} gap={3} flexDirection="column">
                <Text
                  as="h1"
                  size={1}
                  weight="bold"
                  trim={true}
                  style={{color: 'var(--card-fg-color)'}}
                >
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
