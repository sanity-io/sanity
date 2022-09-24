import {Box, Flex, Spinner, Text} from '@sanity/ui'
import React from 'react'

export function SpinnerWithText(props: {text: string}) {
  const {text} = props

  return (
    <Flex direction="row" justify="center" align="center">
      <Spinner />
      <Box marginLeft={2}>
        <Text>{text}</Text>
      </Box>
    </Flex>
  )
}
