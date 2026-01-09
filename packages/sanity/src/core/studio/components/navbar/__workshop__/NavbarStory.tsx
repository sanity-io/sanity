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
import {createContext, useMemo, useState} from 'react'
import {styled} from 'styled-components'

import {defineConfig, type Tool} from '../../../../config'
import {isNonNullable} from '../../../../util/isNonNullable'
import {isTruthy} from '../../../../util/isTruthy'
import {useNavbarComponent} from '../../../studio-components-hooks'
import {StudioProvider} from '../../../StudioProvider'

const SearchFullscreenPortalCard = styled(Card)`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  flex: 1;
`

const ExampleTool = () => <div>Tool</div>

const noop = () => null

interface NavbarContextValue {
  onSearchOpenChange: (open: boolean) => void
  fullscreenSearchPortalEl: HTMLElement | null
}

export const NavbarContext = createContext<NavbarContextValue>({
  fullscreenSearchPortalEl: null,
  onSearchOpenChange: () => '',
})

export default function NavbarStory() {
  const projectName = useString('Project name', undefined)
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null)
  const Navbar = useNavbarComponent()

  // Create configuration
  const tools = useTools()
  const config = useMemo(
    () =>
      defineConfig({
        // The same id as in the test-studio sanity.config.ts
        projectId: 'ppsg7ml5',
        dataset: 'production',
        name: 'default',
        title: projectName,
        tools,
      }),
    [projectName, tools],
  )

  const navbarContextValue = useMemo(
    () => ({fullscreenSearchPortalEl: portalEl, onSearchOpenChange: noop}),
    [portalEl],
  )

  return (
    <StudioProvider config={config}>
      <NavbarContext.Provider value={navbarContextValue}>
        <Navbar />
      </NavbarContext.Provider>
      <SearchFullscreenPortalCard ref={setPortalEl} />
    </StudioProvider>
  )
}

function useTools(): Tool[] {
  const dashboard = useBoolean('Dashboard')
  const content = useBoolean('Content')
  const settings = useBoolean('Settings')
  const vision = useBoolean('Vision')
  const schema = useBoolean('Schema')
  const arcade = useBoolean('Arcade')

  return useMemo(
    () =>
      [
        dashboard && {
          name: 'dashboard',
          title: 'Dashboard',
          icon: DashboardIcon,
          component: ExampleTool,
          options: {},
        },
        content && {
          name: 'content',
          title: 'Content',
          icon: MasterDetailIcon,
          component: ExampleTool,
          options: {},
        },
        settings && {
          name: 'settings',
          title: 'Settings',
          icon: CogIcon,
          component: ExampleTool,
          options: {},
        },
        vision && {
          name: 'vision',
          title: 'Vision',
          icon: EyeOpenIcon,
          component: ExampleTool,
          options: {},
        },
        schema && {
          name: 'schema',
          title: 'Schema',
          icon: DocumentsIcon,
          component: ExampleTool,
          options: {},
        },
        arcade && {
          name: 'arcade',
          title: 'Arcade',
          icon: IceCreamIcon,
          component: ExampleTool,
          options: {},
        },
      ]
        .filter(isTruthy)
        .filter(isNonNullable),
    [dashboard, content, settings, vision, schema, arcade],
  )
}
