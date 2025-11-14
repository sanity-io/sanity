import {Card, Stack, Text} from '@sanity/ui'

import {
  type PaneListItem,
  type PaneListItemDivider,
} from '../../../../packages/sanity/src/structure/types'

interface CustomListViewProps {
  items: (PaneListItem<unknown> | PaneListItemDivider)[]
  title: string
  options?: Record<string, unknown>
}

export function CustomListView(props: CustomListViewProps) {
  const {items, title, options} = props

  return (
    <Card padding={4}>
      <Stack space={4}>
        <Text size={3} weight="bold">
          Custom List View: {title}
        </Text>

        <Text size={1} muted>
          This is a custom view for the list! It has {items.length} items.
        </Text>

        {options && Object.keys(options).length > 0 && (
          <Card padding={3} radius={2} shadow={1}>
            <Text size={1} weight="semibold">
              Options:
            </Text>
            <pre>{JSON.stringify(options, null, 2)}</pre>
          </Card>
        )}

        <Card padding={3} radius={2} shadow={1}>
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Items:
            </Text>
            {items.map((item, idx) => {
              if (item.type === 'divider') {
                return (
                  <Text key={`divider-${idx}`} size={1} muted>
                    --- Divider ---
                  </Text>
                )
              }
              return (
                <Text key={item.id} size={1}>
                  • {item.title || item.id}
                </Text>
              )
            })}
          </Stack>
        </Card>
      </Stack>
    </Card>
  )
}
