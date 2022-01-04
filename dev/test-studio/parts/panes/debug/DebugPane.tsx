import {usePaneRouter} from '@sanity/desk-tool'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ControlsIcon,
  LinkIcon,
  IceCreamIcon,
} from '@sanity/icons'
import {Box, Card, Code, Flex, Stack, Text} from '@sanity/ui'
import React, {useMemo} from 'react'

function usePaneChildLinkComponent(props: {
  id: string
  params?: Record<string, string>
}): React.ComponentType {
  const {id, params} = props
  const {ChildLink} = usePaneRouter()

  return useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    return function Link(linkProps: any) {
      return <ChildLink {...linkProps} childId={id} childParameters={params || {}} />
    }
  }, [ChildLink, id, params])
}

function usePaneParameterizedLinkComponent(props: {
  params?: Record<string, string>
  payload?: unknown
}): React.ComponentType {
  const {params, payload} = props
  const {ParameterizedLink} = usePaneRouter()

  return useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    return function Link(linkProps: any) {
      return <ParameterizedLink {...linkProps} params={params} payload={payload} />
    }
  }, [ParameterizedLink, params, payload])
}

export function DebugPane(props: any) {
  const {childItemId, id, isActive, isSelected, itemId, options, paneKey, urlParams} = props
  const paneRouter = usePaneRouter()
  const {groupIndex, hasGroupSiblings, index, params, payload, siblingIndex} = paneRouter
  const ChildLink = usePaneChildLinkComponent({id: 'test'})
  const ParameterizedLink = usePaneParameterizedLinkComponent({
    params: {param1: 'test'},
    payload: {key: 'foo'},
  })

  // this is used to see whether or not the component re-renders.
  //
  // notice that the ID is only created on mount and should not change between
  // subsequent re-renders, therefore this ID will only change when the parent
  // component re-renders.
  const randomId = useMemo(() => Math.floor(Math.random() * 10000000).toString(16), [])

  return (
    <Box height="fill">
      <Card borderBottom padding={2}>
        <Stack space={1}>
          <Card
            as={ChildLink}
            data-as="a"
            padding={3}
            pressed={!isActive && childItemId === 'test'}
            radius={2}
            selected={isActive && childItemId === 'test'}
          >
            <Flex>
              <Box>
                <Text>
                  <LinkIcon />
                </Text>
              </Box>
              <Box flex={1} marginLeft={3}>
                <Text textOverflow="ellipsis">ChildLink</Text>
              </Box>
              <Box>
                <Text>
                  <ChevronRightIcon />
                </Text>
              </Box>
            </Flex>
          </Card>

          <Card
            as={ParameterizedLink}
            data-as="a"
            padding={3}
            pressed={params?.param1 === 'test'}
            radius={2}
          >
            <Flex>
              <Box>
                <Text>
                  <ControlsIcon />
                </Text>
              </Box>
              <Box flex={1} marginLeft={3}>
                <Text textOverflow="ellipsis">ParameterizedLink</Text>
              </Box>
              <Box>
                <Text>
                  <ChevronDownIcon />
                </Text>
              </Box>
            </Flex>
          </Card>

          <Card padding={3} radius={2}>
            <Flex align="center">
              <Box>
                <Text>
                  <IceCreamIcon />
                </Text>
              </Box>
              <Box flex={1} marginLeft={3}>
                <Flex direction="column" gap={1}>
                  <Text textOverflow="ellipsis">Random ID: {randomId}</Text>
                  <Text textOverflow="ellipsis" size={1} muted>
                    Assigned on component mount
                  </Text>
                </Flex>
              </Box>
            </Flex>
          </Card>
        </Stack>
      </Card>

      <Card padding={4}>
        <Code language="json">
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
            2
          )}
        </Code>
      </Card>
    </Box>
  )
}
