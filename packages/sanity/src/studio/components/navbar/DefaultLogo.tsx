import React from 'react'
import {Button, Text} from '@sanity/ui'

export interface LogoProps {
  href: string
  onClick: React.MouseEventHandler<HTMLElement>
  title: string
}

export function DefaultLogo(props: LogoProps) {
  const {title, href, onClick} = props

  return (
    <Button aria-label={title} as="a" href={href} mode="bleed" onClick={onClick} padding={3}>
      <Text weight="bold">{title}</Text>
    </Button>
  )
}
