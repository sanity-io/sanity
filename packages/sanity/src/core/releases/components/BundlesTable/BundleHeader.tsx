/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable i18next/no-literal-string */
import {Box, Button, Card, Flex, Text} from '@sanity/ui'

export function BundleHeader() {
  return (
    <Card as="thead" radius={3}>
      <Flex as="tr">
        {/* Title */}
        <Flex as="th" align="center" flex={1} paddingX={2} paddingY={1} paddingLeft={3}>
          <Box paddingY={1}>
            <Text muted size={1}>
              Release
            </Text>
          </Box>
        </Flex>
        {/* Published */}
        <Flex
          as="th"
          align="center"
          gap={1}
          paddingX={1}
          paddingY={0}
          sizing="border"
          style={{width: 100}}
        >
          <Button mode="bleed" padding={1} space={1} text="Published" />
        </Flex>
        {/* Actions */}
        <Flex
          align="center"
          gap={1}
          as="th"
          paddingX={2}
          paddingY={1}
          sizing="border"
          style={{width: 50}}
        />
      </Flex>
    </Card>
  )
}
