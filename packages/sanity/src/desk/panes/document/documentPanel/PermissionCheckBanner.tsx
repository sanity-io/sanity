import React from 'react'
import {Box, Card, Container, Flex, Text} from '@sanity/ui'
import {ReadOnlyIcon} from '@sanity/icons'
import styled from 'styled-components'
import {structureLocaleNamespace} from '../../../i18n'
import {useCurrentUser, useTranslation} from 'sanity'

const Root = styled(Card)`
  position: relative;
  z-index: 50;
`

interface PermissionCheckBannerProps {
  granted: boolean
  requiredPermission: string
}

export function PermissionCheckBanner({granted, requiredPermission}: PermissionCheckBannerProps) {
  const currentUser = useCurrentUser()
  const plural = currentUser?.roles?.length !== 1

  const roles = join(
    currentUser?.roles?.map((r) => <code key={r.name}>{r.title}</code>) || [],
    ', ',
  )
  const {t} = useTranslation(structureLocaleNamespace)

  if (granted) return null

  return (
    <Root data-testid="permission-check-banner" shadow={1} tone="transparent">
      <Container paddingX={4} paddingY={3} sizing="border" width={1}>
        <Flex align="flex-start">
          <Text size={1}>
            <ReadOnlyIcon />
          </Text>

          <Box flex={1} marginLeft={3}>
            <Text size={1}>
              {plural
                ? t('banners.permission-check-banner.plural-roles.text', {
                    roles,
                    requiredPermission,
                  })
                : t('banners.permission-check-banner.singular-role.text', {
                    roles,
                    requiredPermission,
                  })}
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
