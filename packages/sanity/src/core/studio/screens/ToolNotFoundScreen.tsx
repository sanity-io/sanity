/* oxlint-disable i18next/no-literal-string */
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Card} from '@sanity/ui'
import {Text, Container, Flex, Box, Icon} from 'ui5'

export function ToolNotFoundScreen(props: {toolName: string}) {
  const {toolName} = props

  return (
    <Card height="fill">
      <Flex alignItems="center" height="100%" justifyContent="center" padding={4}>
        <Container size={0}>
          <Card padding={4} radius={2} shadow={1} tone="caution">
            <Flex>
              <Box>
                <Icon
                  muted
                  size={1}
                  icon={WarningOutlineIcon}
                  tone="caution"
                  style={{margin: '-0.375rem'}}
                />
              </Box>
              <Flex flexBasis="0%" flexGrow={1} marginLeft={3} gap={3} flexDirection="column">
                <Text as="h1" size={1} weight="medium" trim={true} tone="caution">
                  Tool not found: <code>{toolName}</code>
                </Text>
              </Flex>
            </Flex>
          </Card>
        </Container>
      </Flex>
    </Card>
  )
}
