import {ErrorOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {Box, Breadcrumbs, Card, Flex, Heading, Stack, Text, ThemeColorToneKey} from '@sanity/ui'
import {generateHelpUrl} from '@sanity/generate-help-url'
import {SchemaValidationProblemGroup} from '@sanity/types'
import React, {useMemo} from 'react'
import styled from 'styled-components'

const TONES: Record<'error' | 'warning', ThemeColorToneKey> = {
  error: 'critical',
  warning: 'caution',
}

const SegmentSpan = styled.code`
  && {
    background: none;
    color: inherit;
  }
`

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
    <Stack space={5}>
      <Heading as="h1">Schema errors</Heading>

      <Stack as="ul" space={4}>
        {items.map(({group, problem}, i) => {
          const isError = problem.severity === 'error'
          const isWarning = problem.severity === 'warning'

          return (
            <Card border key={i} padding={4} radius={2} tone={TONES[problem.severity]}>
              <Flex>
                <Box marginRight={3}>
                  <Text muted size={1}>
                    {isError && <ErrorOutlineIcon />}
                    {isWarning && <WarningOutlineIcon />}
                  </Text>
                </Box>

                <Box flex={1}>
                  <Text size={1} weight="semibold">
                    {isError && <>Schema error</>}
                    {isWarning && <>Schema warning</>}
                  </Text>
                </Box>
              </Flex>

              <Box marginTop={4}>
                <Card border overflow="auto" padding={2} tone="inherit">
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
                          <Text key={j} size={1}>
                            <SegmentSpan>{`${_renderSegmentName(segment.name)}:${
                              segment.type
                            }`}</SegmentSpan>
                          </Text>
                        )
                      }

                      if (segment.kind === 'property') {
                        return (
                          <Text key={j} size={1}>
                            <SegmentSpan>{segment.name}</SegmentSpan>
                          </Text>
                        )
                      }

                      return null
                    })}
                  </Breadcrumbs>
                </Card>
              </Box>

              <Box as="ul" marginTop={4}>
                <Box as="li">
                  <Stack space={3}>
                    <Text muted size={1}>
                      {problem.message}
                    </Text>

                    {problem.helpId && (
                      <Text muted size={1}>
                        <a
                          href={generateHelpUrl(problem.helpId)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View documentation &rarr;
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
    </Stack>
  )
}

function _renderSegmentName(str: string) {
  if (str.startsWith('<unnamed_type_@_index')) {
    const parts = str.slice(1, -1).split('_')

    return `[${parts[4]}]`
  }

  return str
}
