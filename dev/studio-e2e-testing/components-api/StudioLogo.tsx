import {Box} from '@sanity/ui'
import React from 'react'
import {LogoProps} from 'sanity'

export function StudioLogo(props: LogoProps) {
  return <Box data-testid="config-studio-logo">{props.renderDefault(props)}</Box>
}
