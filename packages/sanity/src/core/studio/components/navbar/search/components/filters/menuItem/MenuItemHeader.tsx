import {Card, Label} from '@sanity/ui'
import React from 'react'

interface MenuItemHeaderFields {
  isFirst?: boolean
  title: string
}

export const MenuItemHeader = React.memo(function MenuItemHeader({
  isFirst,
  title,
}: MenuItemHeaderFields) {
  return (
    <Card borderBottom marginTop={isFirst ? 0 : 2} padding={3}>
      <Label muted size={0}>
        {title}
      </Label>
    </Card>
  )
})
