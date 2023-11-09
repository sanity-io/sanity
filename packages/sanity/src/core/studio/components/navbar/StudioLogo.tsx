import {Box, Text} from '@sanity/ui'
import React from 'react'
import {LogoProps} from '../../../config'

/**
 * @hidden
 * @beta */
export function StudioLogo(props: LogoProps) {
  const {title} = props

  return (
    <Box padding={3}>
      <Text weight="medium">{title}</Text>
    </Box>
  )
}
