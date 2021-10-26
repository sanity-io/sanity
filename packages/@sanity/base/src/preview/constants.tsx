import React from 'react'
import styled from 'styled-components'
import {Flex, Text} from '@sanity/ui'
import {WarningOutlineIcon} from '@sanity/icons'
import {PreviewValue} from '@sanity/types'
import {AvailabilityReason} from './types'

export const INCLUDE_FIELDS_QUERY = ['_id', '_rev', '_type']
export const INCLUDE_FIELDS = [...INCLUDE_FIELDS_QUERY, '_key']

export const AVAILABILITY_READABLE = {
  available: true,
  reason: AvailabilityReason.READABLE,
} as const

export const AVAILABILITY_PERMISSION_DENIED = {
  available: false,
  reason: AvailabilityReason.PERMISSION_DENIED,
} as const

export const AVAILABILITY_NOT_FOUND = {
  available: false,
  reason: AvailabilityReason.NOT_FOUND,
} as const

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

export const INVALID_PREVIEW_FALLBACK: PreviewValue = {
  // The `<small>` element is used for more compatibility
  // with the different downstream preview components.
  title: <small>Invalid preview config</small>,
  subtitle: <small>Check the error log in the console</small>,
  media: (
    <IconWrapper>
      <WarningOutlineIcon />
    </IconWrapper>
  ),
}
