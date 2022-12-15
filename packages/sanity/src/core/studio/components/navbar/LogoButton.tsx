import React from 'react'
import {Button} from '@sanity/ui'

interface LogoButtonProps {
  onClick: React.MouseEventHandler<HTMLElement>
  children: React.ReactNode
  href: string
  title: string
}

export function LogoButton(props: LogoButtonProps) {
  const {title, children, href, onClick} = props

  return (
    <Button
      aria-label={title}
      as="a"
      data-testid="logo"
      href={href}
      mode="bleed"
      onClick={onClick}
      padding={0}
    >
      {children}
    </Button>
  )
}
