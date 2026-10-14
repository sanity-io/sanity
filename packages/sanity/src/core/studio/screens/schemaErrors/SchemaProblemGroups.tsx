/* oxlint-disable i18next/no-literal-string */
import {generateHelpUrl} from '@sanity/generate-help-url'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type SchemaValidationProblemGroup} from '@sanity/types'
import {Card} from '@sanity/ui'
import {Breadcrumbs} from '@sanity/ui/breadcrumbs'
import capitalize from 'lodash-es/capitalize.js'
import {useMemo} from 'react'
import {styled} from 'styled-components'
import {Text, VStack, Flex, Box, type TextProps, Icon, Link} from 'ui5'

import {getTypeInfo} from './getTypeInfo'

const TONES: Record<'error' | 'warning', TextProps['tone']> = {
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
    <VStack as="ul" gap={4}>
      {items.map(({group, problem}, i) => {
        const isError = problem.severity === 'error'
        const schemaType = getTypeInfo(group)
        return (
          // oxlint-disable-next-line no-array-index-key
          <Card key={i} border padding={4} radius={2} tone={TONES[problem.severity]}>
            <Flex>
              <Box marginRight={3}>
                <Icon
                  muted
                  size={1}
                  icon={isError ? ErrorOutlineIcon : WarningOutlineIcon}
                  tone={TONES[problem.severity]}
                  style={{margin: '-0.375rem'}}
                />
              </Box>

              <Box flexBasis="0%" flexGrow={1}>
                <Text size={1} weight="medium" as="div" trim={true} tone={TONES[problem.severity]}>
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
                    <Text muted size={1} as="div" trim={true} tone={TONES[problem.severity]}>
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
                        <Text
                          // oxlint-disable-next-line no-array-index-key
                          key={j}
                          title={text}
                          size={1}
                          truncate={1}
                          as="div"
                          trim={true}
                          tone={TONES[problem.severity]}
                        >
                          <SegmentSpan>{text}</SegmentSpan>
                        </Text>
                      )
                    }

                    if (segment.kind === 'property') {
                      return (
                        <Text
                          // oxlint-disable-next-line no-array-index-key
                          key={j}
                          title={segment.name}
                          size={1}
                          truncate={1}
                          as="div"
                          trim={true}
                          tone={TONES[problem.severity]}
                        >
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
                <VStack gap={3}>
                  <ErrorMessageText
                    muted
                    size={1}
                    forwardedAs="div"
                    trim={true}
                    tone={TONES[problem.severity]}
                  >
                    {problem.message}
                  </ErrorMessageText>

                  {problem.helpId && (
                    <Text muted size={1} as="div" trim={true} tone={TONES[problem.severity]}>
                      <Link href={generateHelpUrl(problem.helpId)} openInNewTab underlined={false}>
                        View documentation &rarr;
                      </Link>
                    </Text>
                  )}
                </VStack>
              </Box>
            </Box>
          </Card>
        )
      })}
    </VStack>
  )
}

function _renderSegmentName(str: string) {
  if (str?.startsWith('<unnamed_type_@_index')) {
    const parts = str.slice(1, -1).split('_')

    return `[${parts[4]}]`
  }

  return str
}
