/* eslint-disable i18next/no-literal-string */
import {Box, Card, Code, Flex, Text} from '@sanity/ui'
import {startCase} from 'lodash'
import {useEffect} from 'react'
import {styled} from 'styled-components'

const ListItem = styled(Flex)``

const ErrorMessageRoot = styled(Box).attrs({padding: 4})``

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
    <ErrorMessageRoot forwardedAs={Flex} direction="column" gap={4}>
      <Flex direction="column" gap={2}>
        <Text weight="medium" size={3}>
          {startCase(last.type)} Error
        </Text>
      </Flex>

      <Card tone="critical" overflow="auto" padding={4}>
        <Code>{message}</Code>
      </Card>

      <Flex as="ul" direction="column" gap={2}>
        {path.map(({name, type}, index) => (
          // oxlint-disable-next-line no-array-index-key
          <ListItem key={index} forwardedAs="li" gap={2} align="center">
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
    </ErrorMessageRoot>
  )
}
