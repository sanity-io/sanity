import {WarningOutlineIcon, AccessDeniedIcon} from '@sanity/icons'
import React from 'react'
import {PreparedValue} from './prepareForPreview'

export const INCLUDE_FIELDS_QUERY = ['_id', '_rev', '_type']
export const INCLUDE_FIELDS = [...INCLUDE_FIELDS_QUERY, '_key']

export class InsufficientPermissionsError extends Error {}

export const INVALID_PREVIEW_FALLBACK: PreparedValue = {
  title: <>Invalid preview config</>,
  subtitle: <>Check the error log in the console</>,
  media: <WarningOutlineIcon />,
  _internalMeta: {type: 'invalid_preview'},
}

export const INSUFFICIENT_PERMISSIONS_FALLBACK: PreparedValue = {
  title: <>Insufficient permissions to access this reference</>,
  media: <AccessDeniedIcon />,
  _internalMeta: {type: 'insufficient_permissions'},
}
