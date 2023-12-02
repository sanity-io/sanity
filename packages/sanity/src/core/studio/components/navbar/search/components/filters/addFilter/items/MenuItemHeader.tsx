import {Box, Card, Text} from '@sanity/ui'
import React from 'react'
import type {FilterMenuItemHeader} from '../../../../types'

interface MenuItemHeaderFields {
  item: FilterMenuItemHeader
}

export const MenuItemHeader = React.memo(function MenuItemHeader({item}: MenuItemHeaderFields) {
  return (
    <Box paddingTop={1}>
      <Card borderBottom paddingX={2} paddingY={3} tone={item?.tone}>
        <Text muted size={1} textOverflow="ellipsis" weight="medium">
          {item.title}
        </Text>
      </Card>
    </Box>
  )
})
