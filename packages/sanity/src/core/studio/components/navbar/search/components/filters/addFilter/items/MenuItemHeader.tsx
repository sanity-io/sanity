import {Box, Card, Label} from '@sanity/ui'
import React from 'react'
import type {FilterMenuItemHeader} from '../../../../types'

interface MenuItemHeaderFields {
  item: FilterMenuItemHeader
}

export const MenuItemHeader = React.memo(function MenuItemHeader({item}: MenuItemHeaderFields) {
  return (
    <Box paddingTop={1}>
      <Card borderBottom padding={3} tone={item?.tone}>
        <Label muted size={0} textOverflow="ellipsis">
          {item.title}
        </Label>
      </Card>
    </Box>
  )
})
