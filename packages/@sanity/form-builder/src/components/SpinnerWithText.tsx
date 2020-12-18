import React from 'react'

import {Flex, Spinner, Text, Box} from '@sanity/ui'

const SpinnerWithText: React.FC<{text: string}> = ({text}) => (
  <Flex direction="row" justify="center" align="center">
    <Spinner />

    <Box padding={2}>
      <Text>{text}</Text>
    </Box>
  </Flex>
)

export {SpinnerWithText}
