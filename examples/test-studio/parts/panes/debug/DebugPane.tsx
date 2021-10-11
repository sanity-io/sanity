import {usePaneRouter} from '@sanity/desk-tool'
import {Card, Code, Stack, Text} from '@sanity/ui'
import React from 'react'

export function DebugPane() {
  const paneRouter = usePaneRouter()

  const {
    ChildLink,
    groupIndex,
    hasGroupSiblings,
    index,
    ParameterizedLink,
    params,
    payload,
    siblingIndex,
  } = paneRouter

  return (
    <Card padding={4}>
      <Code language="json">
        {JSON.stringify(
          {
            groupIndex,
            hasGroupSiblings,
            index,
            params,
            payload,
            siblingIndex,
          },
          null,
          2
        )}
      </Code>

      <Stack marginTop={4} space={1}>
        <Card border padding={4}>
          <Text>
            <ChildLink childId="test" childParameters={{}}>
              ChildLink
            </ChildLink>
          </Text>
        </Card>

        <Card border padding={4}>
          <Text>
            <ParameterizedLink params={{param1: 'test'}} payload={{key: 'foo'}}>
              ParameterizedLink
            </ParameterizedLink>
          </Text>
        </Card>
      </Stack>
    </Card>
  )
}
