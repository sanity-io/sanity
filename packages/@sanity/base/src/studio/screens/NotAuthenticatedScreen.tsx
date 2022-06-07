import {Flex, Card} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {WorkspaceSwitcher} from '../components/navbar/workspace'

const StyledWorkspaceSwitcher = styled(WorkspaceSwitcher)`
  margin: auto;
  width: 350px;
  max-width: 100%;
`

export function NotAuthenticatedScreen() {
  return (
    <Flex
      direction="column"
      height="fill"
      // TODO: currently this card is here to accommodate dark mode vs light
      // mode backgrounds, however that logic should probably exist globally
      as={Card}
    >
      <StyledWorkspaceSwitcher />
    </Flex>
  )
}
