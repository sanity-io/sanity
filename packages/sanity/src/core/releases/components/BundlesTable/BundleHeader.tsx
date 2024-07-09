import {SearchIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'

/**
 * @internal
 */
export interface BundleHeaderProps {
  searchDisabled?: boolean
  searchTerm?: string
  setSearchTerm: (value?: string) => void
}

export function BundleHeader({searchDisabled, searchTerm, setSearchTerm}: BundleHeaderProps) {
  return (
    <Card as="thead" radius={3}>
      <Flex as="tr">
        {/* Title */}
        <Stack as="th" flex={1} paddingY={2} paddingRight={3}>
          <TextInput
            border={false}
            fontSize={1}
            icon={SearchIcon}
            placeholder="Search releases"
            radius={3}
            value={searchTerm}
            disabled={searchDisabled}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            onClear={() => setSearchTerm('')}
            clearButton={!!searchTerm}
          />
        </Stack>
        {/* Number of documents */}
        <Flex as="th" paddingY={3} sizing="border" style={{width: 90}}>
          <Box padding={2}>
            <Text muted size={1} weight="medium">
              Documents
            </Text>
          </Box>
        </Flex>
        {/* Created */}
        <Flex as="th" paddingY={3} sizing="border" style={{width: 100}}>
          <Button mode="bleed" padding={2} radius={3} space={1} text="Created" />
        </Flex>
        {/* Edited */}
        <Flex as="th" paddingY={3} sizing="border" style={{width: 100}}>
          <Button mode="bleed" padding={2} radius={3} space={1} text="Edited" />
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
