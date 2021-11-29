import React from 'react'
import styled from 'styled-components'
import {Flex, Text} from '@sanity/ui'
import {WarningOutlineIcon, AccessDeniedIcon} from '@sanity/icons'
import type {PreparedValue} from './prepareForPreview'

export const INCLUDE_FIELDS_QUERY = ['_id', '_rev', '_type']
export const INCLUDE_FIELDS = [...INCLUDE_FIELDS_QUERY, '_key']

// NOTE: have to use color inherit to make it work correctly with the
// `isSelected` state in the list pane
const IconSizer = styled(Text)`
  color: inherit;
`

function IconWrapper({children}: {children: React.ReactNode}) {
  return (
    <Flex>
      <IconSizer size={3}>{children}</IconSizer>
    </Flex>
  )
}

export class InsufficientPermissionsError extends Error {}

export const INVALID_PREVIEW_FALLBACK: PreparedValue = {
  // The `<small>` element is used for more compatibility
  // with the different downstream preview components.
  title: <small>Invalid preview config</small>,
  subtitle: <small>Check the error log in the console</small>,
  media: (
    <IconWrapper>
      <WarningOutlineIcon />
    </IconWrapper>
  ),
  _internalMeta: {type: 'invalid_preview'},
}

export const INSUFFICIENT_PERMISSIONS_FALLBACK: PreparedValue = {
  // The `<small>` element is used for more compatibility
  // with the different downstream preview components.
  title: <small>Insufficient permissions to access this reference</small>,
  media: (
    <IconWrapper>
      <AccessDeniedIcon />
    </IconWrapper>
  ),
  _internalMeta: {type: 'insufficient_permissions'},
}
