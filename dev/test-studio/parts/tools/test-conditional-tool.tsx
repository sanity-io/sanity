import React from 'react'
import {Container, Box, Text} from '@sanity/ui'

const isTestDataset = window?.location?.pathname?.startsWith(`/test/`)

function ConditionalTool() {
  return (
    <Container>
      <Box padding={5}>
        <Text>
          This Tool should only be visible in the Navbar, registered to the Router and rendering
          this Component if the current URL pathname starts with <code>/test/</code>.
        </Text>
      </Box>
    </Container>
  )
}

export default isTestDataset
  ? {
      title: 'Conditional Tool',
      name: 'test-conditional-tool',
      component: ConditionalTool,
    }
  : null
