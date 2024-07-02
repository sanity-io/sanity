import {SearchIcon} from '@sanity/icons'
import {Button, Card, Flex, Stack, TextInput} from '@sanity/ui'

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
