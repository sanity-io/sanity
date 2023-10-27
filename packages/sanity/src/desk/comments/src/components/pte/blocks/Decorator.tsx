import React from 'react'
import {Strong} from '../CommentMessageSerializer'

interface DecoratorProps {
  children: React.ReactNode
  decorator: string
}

export function Decorator(props: DecoratorProps) {
  const {children, decorator} = props
  switch (decorator) {
    case 'strong':
      return <Strong>{children}</Strong>
    default:
      return children
  }
}
