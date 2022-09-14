import React from 'react'
import {Card, type CardProps} from '@sanity/ui'

export const Checkerboard = ({
  children,
  ...rest
}: CardProps & Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref'>) => {
  return (
    <Card __unstable_checkered {...rest}>
      {children}
    </Card>
  )
}
