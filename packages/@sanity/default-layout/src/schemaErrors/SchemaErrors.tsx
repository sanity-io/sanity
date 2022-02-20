import React from 'react'
import {Box, Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import {ArrowRightIcon, ErrorOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {generateHelpUrl} from '@sanity/generate-help-url'
import PropTypes from 'prop-types'

function renderPath(path) {
  return path
    .map((segment, i) => {
      const key = `s_${i}`
      if (segment.kind === 'type') {
        return (
          <Flex gap={3} align="center" wrap="wrap" key={key}>
            <Text key="name" as="span" size={3} weight="semibold">
              {segment.name}
            </Text>
            <Text key="type" as="span">
              {segment.type}
            </Text>
            {i < path.length - 1 && <ArrowRightIcon />}
          </Flex>
        )
      }
      if (segment.kind === 'property') {
        return (
          <Flex gap={3} align="center" wrap="wrap" key={key}>
            <Text as="span">{segment.name}</Text>
            {i < path.length - 1 && <ArrowRightIcon />}
          </Flex>
        )
      }
      if (segment.kind === 'type') {
        return (
          <Flex gap={3} align="center" wrap="wrap" key={key}>
            <ArrowRightIcon />
            <Text key="name" as="span" size={3} weight="semibold">
              {segment.name}
            </Text>
            <ArrowRightIcon />
            <Text key="type" as="span">
              {segment.type}
            </Text>
          </Flex>
        )
      }

      return null
    })
    .filter(Boolean)
}

function SchemaErrors(props) {
  const {problemGroups} = props

  return (
    <Box>
      <Card padding={[4, 4, 5]} tone="critical">
        <Heading>Uh oh… found errors in schema</Heading>
      </Card>
      <Stack as="ul" space={6} padding={[4, 4, 5]}>
        {problemGroups.map((group, i) => {
          return (
            <Stack as="li" space={5} key={`g_${i}`}>
              <Heading>
                <Flex align="center" gap={3} wrap="wrap">
                  {renderPath(group.path)}
                </Flex>
              </Heading>

              <Box as="ul">
                {group.problems.map((problem, j) => (
                  <Flex as="li" key={`g_${i}_p_${j}`}>
                    <Box flex={1}>
                      <Stack space={4}>
                        <Flex gap={4}>
                          <Box>
                            <Flex
                              direction="column"
                              align="center"
                              justify="center"
                              height="fill"
                              gap={3}
                            >
                              <Text accent weight="semibold" size={1}>
                                {problem.severity === 'error' && <ErrorOutlineIcon />}
                                {problem.severity === 'warning' && <WarningOutlineIcon />}
                              </Text>
                              <Text
                                accent
                                style={{textTransform: 'uppercase'}}
                                weight="semibold"
                                size={1}
                              >
                                {problem.severity}
                              </Text>
                            </Flex>
                          </Box>
                          <Card tone="critical" borderRight />

                          <Flex direction="column" justify="center" gap={4} flex={1}>
                            <Text accent size={0} style={{fontFamily: 'monospace'}}>
                              {problem.message}
                            </Text>
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
                          </Flex>
                        </Flex>
                      </Stack>
                    </Box>
                  </Flex>
                ))}
              </Box>
            </Stack>
          )
        })}
      </Stack>
    </Box>
  )
}

SchemaErrors.propTypes = {
  problemGroups: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.arrayOf(
        PropTypes.shape({
          kind: PropTypes.string,
          type: PropTypes.string,
          name: PropTypes.string,
        })
      ),
      problems: PropTypes.arrayOf(
        PropTypes.shape({
          severity: PropTypes.string,
        })
      ),
    }).isRequired
  ).isRequired,
}

export default SchemaErrors
