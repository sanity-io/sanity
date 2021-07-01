import React from 'react'
import styled from 'styled-components'
import {Flex, Text} from '@sanity/ui'
import {WarningOutlineIcon, AccessDeniedIcon} from '@sanity/icons'
import {PreparedValue} from './prepareForPreview'

export const INCLUDE_FIELDS_QUERY = ['_id', '_rev', '_type']
export const INCLUDE_FIELDS = [...INCLUDE_FIELDS_QUERY, '_key']

// The `<small>` element is used for more compatibility
// with the different downstream preview components
const SmallText = styled.small`
  color: ${({theme}) => theme.sanity.color.muted.default.enabled.fg};
`

function IconWrapper({children}: {children: React.ReactNode}) {
  return (
    <Flex>
      <Text muted size={3}>
        {children}
      </Text>
    </Flex>
  )
}

export class InsufficientPermissionsError extends Error {}

export const INVALID_PREVIEW_FALLBACK: PreparedValue = {
  title: <SmallText>Invalid preview config</SmallText>,
  subtitle: <SmallText>Check the error log in the console</SmallText>,
  media: (
    <IconWrapper>
      <WarningOutlineIcon />
    </IconWrapper>
  ),
  meta: {type: 'invalid_preview'},
}

export const INSUFFICIENT_PERMISSIONS_FALLBACK: PreparedValue = {
  title: <SmallText>Insufficient permissions to access this reference</SmallText>,
  media: (
    <IconWrapper>
      <AccessDeniedIcon />
    </IconWrapper>
  ),
  meta: {type: 'insufficient_permissions'},
}
