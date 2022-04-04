import {
  CogIcon,
  DashboardIcon,
  DocumentsIcon,
  EyeOpenIcon,
  IceCreamIcon,
  MasterDetailIcon,
} from '@sanity/icons'
import {useBoolean, useString} from '@sanity/ui-workshop'
import React, {useMemo} from 'react'
import {createConfig, SanityTool} from '../../config'
import {isNonNullable} from '../../util/isNonNullable'
import {isTruthy} from '../../util/isTruthy'
import {Navbar} from '../components/navbar'
import {StudioProvider} from '../StudioProvider'

const Tool = () => <div>Tool</div>

// const mockClient = createMockClient()

export default function NavbarStory() {
  const projectName = useString('Project name', undefined)

  // Create configuration
  const tools = useTools()
  const config = useMemo(
    () =>
      createConfig({
        projectId: 'myProject',
        dataset: 'production',
        name: 'default',
        title: projectName,
        tools,
      }),
    [projectName, tools]
  )

  return (
    <StudioProvider config={config}>
      <Navbar />
    </StudioProvider>
  )
}

function useTools(): SanityTool[] {
  const toggledTools = {
    dashboard: useBoolean('Dashboard'),
    content: useBoolean('Content'),
    settings: useBoolean('Settings'),
    vision: useBoolean('Vision'),
    schema: useBoolean('Schema'),
    arcade: useBoolean('Arcade'),
  }

  return useMemo(
    () =>
      [
        toggledTools.dashboard && {
          name: 'dashboard',
          title: 'Dashboard',
          icon: DashboardIcon,
          component: Tool,
          options: {},
        },
        toggledTools.content && {
          name: 'content',
          title: 'Content',
          icon: MasterDetailIcon,
          component: Tool,
          options: {},
        },
        toggledTools.settings && {
          name: 'settings',
          title: 'Settings',
          icon: CogIcon,
          component: Tool,
          options: {},
        },
        toggledTools.vision && {
          name: 'vision',
          title: 'Vision',
          icon: EyeOpenIcon,
          component: Tool,
          options: {},
        },
        toggledTools.schema && {
          name: 'schema',
          title: 'Schema',
          icon: DocumentsIcon,
          component: Tool,
          options: {},
        },
        toggledTools.arcade && {
          name: 'arcade',
          title: 'Arcade',
          icon: IceCreamIcon,
          component: Tool,
          options: {},
        },
      ]
        .filter(isTruthy)
        .filter(isNonNullable),
    [
      toggledTools.arcade,
      toggledTools.content,
      toggledTools.dashboard,
      toggledTools.schema,
      toggledTools.settings,
      toggledTools.vision,
    ]
  )
}
