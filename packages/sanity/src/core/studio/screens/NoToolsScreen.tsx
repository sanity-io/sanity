/* oxlint-disable i18next/no-literal-string */
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Card, Text} from '@sanity/ui'
import {Container, Flex, Box} from 'ui5'

export function NoToolsScreen() {
  return (
    <Card height="fill">
      <Flex alignItems="center" height="100%" justifyContent="center" padding={4}>
        <Container size={0}>
          <Card padding={4} radius={2} shadow={1} tone="caution">
            <Flex>
              <Box>
                <Text size={1}>
                  <WarningOutlineIcon />
                </Text>
              </Box>
              <Flex flexBasis="0%" flexGrow={1} marginLeft={3} gap={3} flexDirection="column">
                <Text as="h1" size={1} weight="medium">
                  No configured tools
                </Text>
                <Text as="p" muted size={1}>
                  Please configure a tool in your Studio configuration.
                </Text>
                <Text as="p" muted size={1}>
                  <a
                    href="https://www.sanity.io/docs/studio-tools"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Learn how to add a tool &rarr;
                  </a>
                </Text>
              </Flex>
            </Flex>
          </Card>
        </Container>
      </Flex>
    </Card>
  )
}
