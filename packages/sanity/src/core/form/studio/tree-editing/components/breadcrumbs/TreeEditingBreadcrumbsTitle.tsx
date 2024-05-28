import {Box, Card, Flex, MenuDivider, Text} from '@sanity/ui'

interface TreeEditingBreadcrumbsTitleProps {
  title: string
}

export function TreeEditingBreadcrumbsTitle(props: TreeEditingBreadcrumbsTitleProps): JSX.Element {
  const {title} = props

  return (
    <>
      <Box paddingX={1}>
        <Card padding={3}>
          <Flex align="center" justify="space-between" gap={2}>
            <Text size={1} muted textOverflow="ellipsis">
              {title}
            </Text>
          </Flex>
        </Card>
      </Box>
      <MenuDivider />
    </>
  )
}
