import {ErrorOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {
  Box,
  Breadcrumbs,
  Card,
  Code,
  Container,
  Flex,
  Heading,
  Stack,
  Text,
  ThemeColorToneKey,
} from '@sanity/ui'
import {generateHelpUrl} from '@sanity/generate-help-url'
import {SchemaValidationProblemGroup} from '@sanity/types'
import React, {useMemo} from 'react'

const TONES: Record<'error' | 'warning', ThemeColorToneKey> = {
  error: 'critical',
  warning: 'caution',
}

export function SchemaErrors(props: {problemGroups: SchemaValidationProblemGroup[]}) {
  const {problemGroups} = props

  const items = useMemo(() => {
    const ret = []

    for (const problemGroup of problemGroups) {
      for (const problem of problemGroup.problems) {
        ret.push({group: problemGroup, problem})
      }
    }

    return ret
  }, [problemGroups])

  return (
    <Card height="fill" style={{minHeight: '100%'}}>
      <Container>
        <Box padding={4} paddingTop={[4, 5, 6, 7]}>
          <Heading as="h1">Schema errors</Heading>
        </Box>

        <Stack as="ul" padding={4} space={4}>
          {items.map(({group, problem}, i) => {
            return (
              <Card key={i} radius={2} tone={TONES[problem.severity]}>
                <Flex padding={4}>
                  <Box marginRight={3}>
                    <Text muted size={1}>
                      {problem.severity === 'error' && <ErrorOutlineIcon />}
                      {problem.severity === 'warning' && <WarningOutlineIcon />}
                    </Text>
                  </Box>

                  <Box flex={1}>
                    <Breadcrumbs
                      separator={
                        <Text muted size={1}>
                          &rarr;
                        </Text>
                      }
                    >
                      {group.path.map((segment, j) => {
                        if (segment.kind === 'type') {
                          return (
                            <Code key={j} size={1}>
                              <strong>{segment.name}</strong>: <code>{segment.type}</code>
                            </Code>
                          )
                        }

                        if (segment.kind === 'property') {
                          return (
                            <Code key={j} size={1}>
                              <strong>{segment.name}</strong>
                            </Code>
                          )
                        }

                        return null
                      })}
                    </Breadcrumbs>
                  </Box>
                </Flex>

                <Card borderTop tone="inherit" />

                <Box as="ul" padding={4}>
                  <Box as="li">
                    <Stack space={3}>
                      <Code size={1} style={{whiteSpace: 'pre-wrap'}}>
                        {problem.message}
                      </Code>

                      {problem.helpId && (
                        <Text>
                          <a
                            href={generateHelpUrl(problem.helpId)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View documentation
                          </a>
                        </Text>
                      )}
                    </Stack>
                  </Box>
                </Box>
              </Card>
            )
          })}
        </Stack>
      </Container>
    </Card>
  )
}
