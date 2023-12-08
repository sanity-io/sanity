import {Box} from '@sanity/ui'
import React from 'react'
import {LogoProps} from 'sanity'

export function StudioLogo(props: LogoProps & {testId: string}) {
  const {testId} = props

  return <Box data-testid={testId}>{props.renderDefault(props)}</Box>
}
