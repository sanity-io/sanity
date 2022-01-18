import {WarningOutlineIcon} from '@sanity/icons'
import {PreviewValue} from '@sanity/types'
import React from 'react'
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

export const INVALID_PREVIEW_FALLBACK: PreviewValue = {
  title: 'Invalid preview config',
  subtitle: 'Check the error log in the console',
  media: <WarningOutlineIcon />,
}
