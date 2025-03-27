/* eslint-disable i18next/no-literal-string */
import {generateHelpUrl} from '@sanity/generate-help-url'
import {ErrorOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {type SchemaValidationProblemGroup} from '@sanity/types'
import {Box, Breadcrumbs, Card, Flex, Stack, Text} from '@sanity/ui'
import {type CardTone} from '@sanity/ui/theme'
import {capitalize} from 'lodash'
import {useMemo} from 'react'
import {styled} from 'styled-components'

import {useTranslation} from '../../../i18n'
import {getTypeInfo} from './getTypeInfo'

const TONES: Record<'error' | 'warning', CardTone> = {
  error: 'critical',
  warning: 'caution',
}

const SegmentSpan = styled.code`
  && {
    background: none;
    color: inherit;
  }
`

const ErrorMessageText = styled(Text)`
  white-space: pre-line;
`

export function SchemaProblemGroups(props: {problemGroups: SchemaValidationProblemGroup[]}) {
  const {problemGroups} = props
  const {t} = useTranslation()

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
    <Stack as="ul" gap={4}>
      {items.map(({group, problem}, i) => {
        const isError = problem.severity === 'error'
        const isWarning = problem.severity === 'warning'
        const schemaType = getTypeInfo(group)
        return (
          // oxlint-disable-next-line no-array-index-key
          <Card key={i} border padding={4} radius={2} tone={TONES[problem.severity]}>
            <Flex>
              <Box marginRight={3}>
                <Text muted size={1}>
                  {isError && <ErrorOutlineIcon />}
                  {isWarning && <WarningOutlineIcon />}
                </Text>
              </Box>

              <Box flex={1}>
                <Text size={1} weight="medium">
                  {schemaType ? (
                    <>
                      {capitalize(schemaType.type)} type "{schemaType.name}"
                    </>
                  ) : null}
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
                      const text = `${_renderSegmentName(
                        segment.name || `<anonymous ${segment.type}>`,
                      )}:${segment.type}`
                      return (
                        // oxlint-disable-next-line no-array-index-key
                        <Text key={j} title={text} size={1} textOverflow="ellipsis">
                          <SegmentSpan>{text}</SegmentSpan>
                        </Text>
                      )
                    }

                    if (segment.kind === 'property') {
                      return (
                        // oxlint-disable-next-line no-array-index-key
                        <Text key={j} title={segment.name} size={1} textOverflow="ellipsis">
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
                <Stack gap={3}>
                  <ErrorMessageText muted size={1}>
                    {problem.message}
                  </ErrorMessageText>

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
  )
}

function _renderSegmentName(str: string) {
  if (str?.startsWith('<unnamed_type_@_index')) {
    const parts = str.slice(1, -1).split('_')

    return `[${parts[4]}]`
  }

  return str
}
