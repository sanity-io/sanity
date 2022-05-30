import {
  CogIcon,
  DashboardIcon,
  DocumentsIcon,
  EyeOpenIcon,
  IceCreamIcon,
  MasterDetailIcon,
} from '@sanity/icons'
import {Card} from '@sanity/ui'
import {useBoolean, useString} from '@sanity/ui-workshop'
import React, {useMemo, useState} from 'react'
import styled from 'styled-components'
import {createConfig, Tool} from '../../../../config'
import {isNonNullable} from '../../../../util/isNonNullable'
import {isTruthy} from '../../../../util/isTruthy'
import {Navbar} from '..'
import {StudioProvider} from '../../../StudioProvider'

const SearchFullscreenPortalCard = styled(Card)`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  flex: 1;
`

const ExampleTool = () => <div>Tool</div>

const noop = () => null

// const mockClient = createMockClient()

export default function NavbarStory() {
  const projectName = useString('Project name', undefined)
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null)

  // Create configuration
  const tools = useTools()
  const config = useMemo(
    () =>
      createConfig({
        // The same id as in the test-studio sanity.config.ts
        projectId: 'ppsg7ml5',
        dataset: 'production',
        name: 'default',
        title: projectName,
        tools,
      }),
    [projectName, tools]
  )

  return (
    <StudioProvider config={config}>
      <Navbar onSearchOpenChange={noop} fullscreenSearchPortalEl={portalEl} />
      <SearchFullscreenPortalCard ref={setPortalEl} />
    </StudioProvider>
  )
}

function useTools(): Tool[] {
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
          component: ExampleTool,
          options: {},
        },
        toggledTools.content && {
          name: 'content',
          title: 'Content',
          icon: MasterDetailIcon,
          component: ExampleTool,
          options: {},
        },
        toggledTools.settings && {
          name: 'settings',
          title: 'Settings',
          icon: CogIcon,
          component: ExampleTool,
          options: {},
        },
        toggledTools.vision && {
          name: 'vision',
          title: 'Vision',
          icon: EyeOpenIcon,
          component: ExampleTool,
          options: {},
        },
        toggledTools.schema && {
          name: 'schema',
          title: 'Schema',
          icon: DocumentsIcon,
          component: ExampleTool,
          options: {},
        },
        toggledTools.arcade && {
          name: 'arcade',
          title: 'Arcade',
          icon: IceCreamIcon,
          component: ExampleTool,
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
