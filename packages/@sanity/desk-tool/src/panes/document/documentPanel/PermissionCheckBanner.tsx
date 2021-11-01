import React from 'react'
import {useCurrentUser} from '@sanity/base/hooks'
import {Box, Card, Container, Flex, Text} from '@sanity/ui'
import {ReadOnlyIcon} from '@sanity/icons'
import styled from 'styled-components'
import {useDocumentPane} from '../useDocumentPane'

const Root = styled(Card)`
  position: relative;
  z-index: 50;
`

export function PermissionCheckBanner() {
  const {value: currentUser} = useCurrentUser()
  const {permission, requiredPermission} = useDocumentPane()
  const plural = currentUser?.roles?.length !== 1

  const roles = join(
    currentUser?.roles?.map((r) => <code key={r.name}>{r.title}</code>) || [],
    ', '
  )

  if (!permission) return null
  if (permission.granted) return null

  return (
    <Root data-testid="permission-check-banner" shadow={1} tone="transparent">
      <Container paddingX={4} paddingY={3} sizing="border" width={1}>
        <Flex align="flex-start">
          <Text size={1}>
            <ReadOnlyIcon />
          </Text>

          <Box flex={1} marginLeft={3}>
            <Text size={1}>
              Your role{plural && 's'} {roles} {plural ? 'do' : 'does'} not have permissions to{' '}
              {requiredPermission} this document.
            </Text>
          </Box>
        </Flex>
      </Container>
    </Root>
  )
}

function join<T, S>(array: Array<T>, sep: S): Array<T | S> | null {
  return array.reduce((result: Array<T | S> | null, item: T | S) => {
    if (result === null) {
      return [item]
    }

    return result.concat([sep, item])
  }, null)
}
