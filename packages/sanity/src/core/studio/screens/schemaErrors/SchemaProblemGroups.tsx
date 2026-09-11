/* oxlint-disable i18next/no-literal-string */
import {generateHelpUrl} from '@sanity/generate-help-url'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type SchemaValidationProblemGroup} from '@sanity/types'
import {Card, Stack, Text, type ThemeColorToneKey} from '@sanity/ui'
import {Breadcrumbs} from '@sanity/ui/breadcrumbs'
import capitalize from 'lodash-es/capitalize.js'
import {useMemo} from 'react'
import {Flex, Box} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {getTypeInfo} from './getTypeInfo'
import {errorMessageText, segmentSpan} from './SchemaProblemGroups.css'

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
const TONES: Record<'error' | 'warning', ThemeColorToneKey> = {
  error: 'critical',
  warning: 'caution',
}

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

              <Box flexBasis="0%" flexGrow={1}>
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
                          <code className={segmentSpan}>{text}</code>
                        </Text>
                      )
                    }

                    if (segment.kind === 'property') {
                      return (
                        // oxlint-disable-next-line no-array-index-key
                        <Text key={j} title={segment.name} size={1} textOverflow="ellipsis">
                          <code className={segmentSpan}>{segment.name}</code>
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
                  <Text className={errorMessageText} muted size={1}>
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
  )
}

function _renderSegmentName(str: string) {
  if (str?.startsWith('<unnamed_type_@_index')) {
    const parts = str.slice(1, -1).split('_')

    return `[${parts[4]}]`
  }

  return str
}
