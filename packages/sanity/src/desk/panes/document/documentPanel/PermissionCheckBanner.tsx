import React from 'react'
import {Box, Card, Container, Flex, Text} from '@sanity/ui'
import {ReadOnlyIcon} from '@sanity/icons'
import styled from 'styled-components'
import {structureLocaleNamespace} from '../../../i18n'
import {Translate, useCurrentUser, useIntlListFormat, useTranslation} from 'sanity'

const Root = styled(Card)`
  position: relative;
  z-index: 50;
`

interface PermissionCheckBannerProps {
  granted: boolean
  requiredPermission: 'update' | 'create'
}

export function PermissionCheckBanner({granted, requiredPermission}: PermissionCheckBannerProps) {
  const currentUser = useCurrentUser()
  const listFormat = useIntlListFormat({style: 'short'})
  const {t} = useTranslation(structureLocaleNamespace)

  if (granted) return null

  const roleTitles = (currentUser?.roles || []).map((role) => role.title)
  const roles = listFormat
    .formatToParts(roleTitles)
    .map((part) =>
      part.type === 'element' ? <code key={part.value}>{part.value}</code> : part.value,
    )

  return (
    <Root data-testid="permission-check-banner" shadow={1} tone="transparent">
      <Container paddingX={4} paddingY={3} sizing="border" width={1}>
        <Flex align="flex-start">
          <Text size={1}>
            <ReadOnlyIcon />
          </Text>

          <Box flex={1} marginLeft={3}>
            <Text size={1}>
              <Translate
                t={t}
                i18nKey="banners.permission-check-banner.missing-permission"
                components={{Roles: () => <>{roles}</>}}
                values={{count: roles.length, roles: roleTitles}}
                context={requiredPermission}
              />
            </Text>
          </Box>
        </Flex>
      </Container>
    </Root>
  )
}
