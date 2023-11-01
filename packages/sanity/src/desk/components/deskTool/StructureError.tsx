import {generateHelpUrl} from '@sanity/generate-help-url'
import {Box, Button, Card, Code, Container, Heading, Label, Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import styled from 'styled-components'
import {SyncIcon} from '@sanity/icons'
import {SerializeError} from '../../structureBuilder'
import {PaneResolutionError} from '../../structureResolvers'
import {deskLocaleNamespace} from '../../i18n'
import {useTranslation} from 'sanity'

const PathSegment = styled.span`
  &:not(:last-child)::after {
    content: ' ➝ ';
    opacity: 0.5;
  }
`

function formatStack(stack: string) {
  return (
    stack
      // Prettify builder functions
      .replace(/\(\.\.\.\)\./g, '(...)\n  .')
      // Remove webpack cruft from function names
      .replace(/__WEBPACK_IMPORTED_MODULE_\d+_+/g, '')
      // Remove default export postfix from function names
      .replace(/___default\./g, '.')
      // Replace full host path, leave only path to JS-file
      .replace(new RegExp(` \\(https?:\\/\\/${window.location.host}`, 'g'), ' (')
  )
}

interface StructureErrorProps {
  error: unknown
}

export function StructureError({error}: StructureErrorProps) {
  if (!(error instanceof PaneResolutionError)) {
    throw error
  }
  const {cause} = error
  const {t} = useTranslation(deskLocaleNamespace)

  // Serialize errors are well-formatted and should be readable, in these cases a stack trace is
  // usually not helpful. Build errors in dev (with HMR) usually also contains a bunch of garbage
  // instead of an actual error message, so make sure we show the message in these cases as well
  const stack = cause?.stack || error.stack
  const showStack =
    stack && !(cause instanceof SerializeError) && !error.message.includes('Module build failed:')

  const path = cause instanceof SerializeError ? cause.path : []
  const helpId = (cause instanceof SerializeError && cause.helpId) || error.helpId

  const handleReload = useCallback(() => {
    window.location.reload()
  }, [])

  return (
    <Card height="fill" overflow="auto" padding={4} sizing="border" tone="critical">
      <Container>
        <Heading as="h2">{t('structure-error.header.text')}</Heading>

        <Card marginTop={4} padding={4} radius={2} overflow="auto" shadow={1} tone="inherit">
          {path.length > 0 && (
            <Stack space={2}>
              <Label>{t('structure-error.structure-path.label')}</Label>
              <Code>
                {/* TODO: it seems like the path is off by one and includes */}
                {/* `root` twice  */}
                {path.slice(1).map((segment, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <PathSegment key={`${segment}-${i}`}>{segment}</PathSegment>
                ))}
              </Code>
            </Stack>
          )}

          <Stack marginTop={4} space={2}>
            <Label>{t('structure-error.error.label')}</Label>
            <Code>{showStack ? formatStack(stack) : error.message}</Code>
          </Stack>

          {helpId && (
            <Box marginTop={4}>
              <Text>
                <a href={generateHelpUrl(helpId)} rel="noopener noreferrer" target="_blank">
                  {t('structure-error.docs-link.text')}
                </a>
              </Text>
            </Box>
          )}

          <Box marginTop={4}>
            <Button
              text={t('structure-error.reload-button.text')}
              icon={SyncIcon}
              tone="primary"
              onClick={handleReload}
            />
          </Box>
        </Card>
      </Container>
    </Card>
  )
}
