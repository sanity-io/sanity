import {Card} from '@sanity/ui'
import {memo} from 'react'
import {Text, Box} from 'ui5'

import {type FilterMenuItemHeader} from '../../../../types'

interface MenuItemHeaderFields {
  item: FilterMenuItemHeader
}

export const MenuItemHeader = memo(function MenuItemHeader({item}: MenuItemHeaderFields) {
  return (
    <Box paddingTop={1}>
      <Card borderBottom paddingX={2} paddingY={3} tone={item?.tone}>
        <Text
          muted
          size={1}
          truncate={1}
          weight="medium"
          as="div"
          trim={true}
          style={{color: 'var(--card-muted-fg-color)'}}
        >
          {item.title}
        </Text>
      </Card>
    </Box>
  )
})
