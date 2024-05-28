import {Box, Card, Text} from '@sanity/ui'

interface TreeEditingBreadcrumbsTitleProps {
  title: string
}

export function TreeEditingBreadcrumbsTitle(props: TreeEditingBreadcrumbsTitleProps): JSX.Element {
  const {title} = props

  return (
    <Card borderBottom padding={3} sizing="border">
      <Box paddingX={1} sizing="border">
        <Text size={1} muted textOverflow="ellipsis">
          {title}
        </Text>
      </Box>
    </Card>
  )
}
