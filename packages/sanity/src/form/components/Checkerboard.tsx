import React, {type PropsWithChildren} from 'react'
import {Card, type CardProps} from '@sanity/ui'

export const Checkerboard = ({children, ...rest}: PropsWithChildren<CardProps>) => {
  return (
    <Card __unstable_checkered {...rest}>
      {children}
    </Card>
  )
}
