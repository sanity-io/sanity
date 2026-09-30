import {Card, Text} from '@sanity/ui'
import {
  type NavbarProps,
  StudioToolMenu,
  type ToolMenuProps,
  ToolLink,
  UserAvatar,
  useTools,
} from 'sanity'
import {useRouterState} from 'sanity/router'
import {Box, Flex} from 'ui5'

function renderDefaultToolMenu(props: ToolMenuProps) {
  return <StudioToolMenu {...props} />
}

function handleCloseSidebar() {}

export function EdenNavbar(_props: Omit<NavbarProps, 'renderDefault'>) {
  const tools = useTools()
  const routerState = useRouterState()
  const activeToolName = typeof routerState.tool === 'string' ? routerState.tool : undefined

  return (
    <Card borderBottom padding={3} sizing="border" data-testid="eden-navbar">
      <Flex alignItems="center" justifyContent="space-between">
        <Flex alignItems="center" flexShrink={0}>
          <ToolLink name="dashboard" data-testid="eden-home">
            <Text size={2} weight="medium">
              Eden
            </Text>
          </ToolLink>
        </Flex>

        <Flex
          alignItems="center"
          flexGrow={1}
          justifyContent="center"
          minWidth="0"
          overflow="hidden"
        >
          <StudioToolMenu
            activeToolName={activeToolName}
            closeSidebar={handleCloseSidebar}
            context="topbar"
            isSidebarOpen={false}
            renderDefault={renderDefaultToolMenu}
            tools={tools}
          />
        </Flex>

        <Box flexShrink={0}>
          <UserAvatar size={1} user="me" />
        </Box>
      </Flex>
    </Card>
  )
}
