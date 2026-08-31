/* oxlint-disable i18next/no-literal-string */
import {Card, Text} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import startCase from 'lodash-es/startCase.js'
import {useEffect} from 'react'
import {styled} from 'styled-components'
import {Flex, Box} from 'ui5'

const ListItem = styled(Flex)``

/**
 * @internal
 */
export interface ErrorMessageProps {
  message: string
  stack?: string
  error: unknown
  path: Array<{name: string; type: string}>
}

/**
 * @internal
 */
export function ErrorMessage({error, message, path, stack}: ErrorMessageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const last = path[path.length - 1]

  return (
    <Flex flexDirection="column" gap={4} padding={4}>
      <Flex flexDirection="column" gap={2}>
        <Text weight="medium" size={3}>
          {startCase(last.type)} Error
        </Text>
      </Flex>

      <Card tone="critical" overflow="auto" padding={4}>
        <Code>{message}</Code>
      </Card>

      <Flex as="ul" flexDirection="column" gap={2}>
        {path.map(({name, type}, index) => (
          // oxlint-disable-next-line no-array-index-key
          <ListItem key={index} forwardedAs="li" gap={2} alignItems="center">
            <Box>
              <Code>{name}</Code>
            </Box>
            <Box>
              <Text muted size={1}>
                {type}
              </Text>
            </Box>
          </ListItem>
        ))}
      </Flex>

      {stack && (
        <details>
          <Text as="summary">Stack Trace</Text>

          <Box overflow="auto" marginTop={4}>
            <Code>{stack}</Code>
          </Box>
        </details>
      )}
    </Flex>
  )
}
