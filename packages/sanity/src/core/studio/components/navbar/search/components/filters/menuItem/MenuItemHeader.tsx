import {Card, Label} from '@sanity/ui'
import React from 'react'
import type {SearchFilterMenuItemHeader} from '../../../types'

interface MenuItemHeaderFields {
  isFirst?: boolean
  item: SearchFilterMenuItemHeader
}

export const MenuItemHeader = React.memo(function MenuItemHeader({
  isFirst,
  item,
}: MenuItemHeaderFields) {
  return (
    <Card borderBottom marginTop={isFirst ? 0 : 2} padding={3} tone={item?.tone}>
      <Label muted size={0} textOverflow="ellipsis">
        {item.title}
      </Label>
    </Card>
  )
})
