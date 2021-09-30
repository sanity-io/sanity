import {useRouter} from '@sanity/base/router'
import {Box, Card, Flex, Spinner, Text} from '@sanity/ui'
import React, {useEffect} from 'react'
import {Delay} from '../Delay'

export function Redirect({panes}) {
  const router = useRouter()

  useEffect(() => {
    // Navigates to passed router panes state on mount
    router.navigate({panes}, {replace: true})
  })

  return (
    <Card height="fill">
      <Delay ms={300}>
        <Flex align="center" direction="column" height="fill" justify="center">
          <Spinner muted />
          <Box marginTop={3}>
            <Text muted size={1}>
              Redirecting…
            </Text>
          </Box>
        </Flex>
      </Delay>
    </Card>
  )
}
