import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {ControlsIcon} from '@sanity/icons/Controls'
import {LinkIcon} from '@sanity/icons/Link'
import {Card, Text} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {useState} from 'react'
import {usePaneRouter, type UserComponent} from 'sanity/structure'
import {Flex, Box, VStack} from 'ui5'

const CHILD_LINK_PARAMETERS: Record<string, string> = {}
const PARAMETERIZED_LINK_PARAMS: Record<string, string> = {param1: 'test'}
const PARAMETERIZED_LINK_PAYLOAD = {key: 'foo'}

export const DebugPane: UserComponent = function DebugPane(props) {
  const {childItemId, id, isActive, isSelected, itemId, options, paneKey, urlParams} = props
  const {
    ChildLink,
    ParameterizedLink,
    groupIndex,
    hasGroupSiblings,
    index,
    params,
    payload,
    siblingIndex,
  } = usePaneRouter()

  // this is used to see whether or not the component re-renders.
  //
  // notice that the ID is only created on mount and should not change between
  // subsequent re-renders, therefore this ID will only change when the parent
  // component re-renders.
  const [randomId] = useState(() => Math.floor(Math.random() * 10000000).toString(16))

  return (
    <Box height="100%">
      <Box padding={4} paddingTop={0}>
        <VStack gap={3}>
          <Text muted size={1} textOverflow="ellipsis">
            Random ID: <code>{randomId}</code>
          </Text>
          <Text textOverflow="ellipsis" size={1} muted>
            Assigned on pane component mount
          </Text>
        </VStack>
      </Box>

      <Card borderBottom padding={2}>
        <VStack gap={1}>
          <Card
            as={ChildLink}
            childId="test"
            childParameters={CHILD_LINK_PARAMETERS}
            data-as="a"
            padding={3}
            pressed={!isActive && childItemId === 'test'}
            radius={2}
            selected={isActive && childItemId === 'test'}
          >
            <Flex>
              <Box>
                <Text size={1}>
                  <LinkIcon />
                </Text>
              </Box>
              <Box flexBasis="0%" flexGrow={1} marginLeft={3}>
                <Text size={1} textOverflow="ellipsis">
                  ChildLink
                </Text>
              </Box>
              <Box>
                <Text size={1}>
                  <ChevronRightIcon />
                </Text>
              </Box>
            </Flex>
          </Card>

          <Card
            as={ParameterizedLink}
            params={PARAMETERIZED_LINK_PARAMS}
            payload={PARAMETERIZED_LINK_PAYLOAD}
            data-as="a"
            padding={3}
            pressed={params?.param1 === 'test'}
            radius={2}
          >
            <Flex>
              <Box>
                <Text size={1}>
                  <ControlsIcon />
                </Text>
              </Box>
              <Box flexBasis="0%" flexGrow={1} marginLeft={3}>
                <Text size={1} textOverflow="ellipsis">
                  ParameterizedLink
                </Text>
              </Box>
              <Box>
                <Text size={1}>
                  <ChevronDownIcon />
                </Text>
              </Box>
            </Flex>
          </Card>
        </VStack>
      </Card>

      <Card padding={4}>
        <Code language="json" size={1}>
          {JSON.stringify(
            {
              paneRouter: {
                groupIndex,
                hasGroupSiblings,
                index,
                params,
                payload,
                siblingIndex,
              },
              props: {
                childItemId,
                id,
                isActive,
                isSelected,
                itemId,
                options,
                paneKey,
                urlParams,
              },
            },
            null,
            2,
          )}
        </Code>
      </Card>
    </Box>
  )
}
