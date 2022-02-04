import React from 'react'
import {Container, Stack, Text} from '@sanity/ui'
import {CheckmarkIcon} from '@sanity/icons'

const pathName = (typeof window !== 'undefined' && window.location.pathname) || '/'
const isTestDataset = pathName.startsWith('/test') || pathName === '/'

function ConditionalTool() {
  return (
    <Container>
      <Stack padding={5} space={4}>
        <Text>
          This Tool should only be visible in the Navbar, registered to the Router and rendering
          this Component if the current URL pathname starts with <code>/test/</code>.
        </Text>
        <Text>
          <strong>Note:</strong> This is a "hack", not a "core feature" - in the future we will
          provide better primitives for conditionally determining tools based on user roles and
          similar.
        </Text>
      </Stack>
    </Container>
  )
}

export default isTestDataset
  ? {
      title: 'Conditional Tool',
      name: 'test-conditional-tool',
      component: ConditionalTool,
      icon: CheckmarkIcon,
    }
  : null
