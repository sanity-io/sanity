import {DashboardIcon} from '@sanity/icons/Dashboard'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {MasterDetailIcon} from '@sanity/icons/MasterDetail'
import {Card, Text} from '@sanity/ui'
import {RouterProvider} from 'sanity/router'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type Tool} from '../../../../../config/types'
import {ColorSchemeProvider} from '../../../../colorScheme'
import {createRouter} from '../../../../router/router'
import {ToolVerticalMenu} from '../../tools/ToolVerticalMenu'
import {AppearanceMenu} from '../ApperanceMenu'

const NOOP = () => undefined

function NullTool() {
  return null
}

const TOOLS: Tool[] = [
  {name: 'structure', title: 'Structure', icon: MasterDetailIcon, component: NullTool},
  {name: 'vision', title: 'Vision', icon: EyeOpenIcon, component: NullTool},
  {name: 'dashboard', title: 'Dashboard', icon: DashboardIcon, component: NullTool},
]

// ToolLink resolves `{tool, [tool]: undefined}` router state to an href, which
// needs the studio's per-tool scoped routes; the shared mock-studio router
// only defines intents.
const router = createRouter({tools: TOOLS})

/**
 * Chromatic sentinel for the nav drawer's stacked button lists after the ui5
 * Stack to VStack migration: the tool list (`as="ul"` / `as="li"` rows of
 * bleed buttons, one selected) and the appearance menu (icon buttons with a
 * trailing checkmark on the selected scheme, inside a `borderTop` Card). The
 * list semantics and the gap between rows are what the swap can silently
 * change. Tools are fixtures; the scheme is pinned to `system` so the
 * checkmark position never depends on the browser's stored preference.
 */
export function NavDrawerMenusStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <RouterProvider router={router} state={{}} onNavigate={NOOP}>
        <ColorSchemeProvider scheme="system">
          <Card padding={4} style={{maxWidth: 280}}>
            <VStack gap={5}>
              <VStack gap={2}>
                <Text muted size={1} weight="medium">
                  tool menu (structure active)
                </Text>
                <Card padding={2}>
                  <ToolVerticalMenu activeToolName="structure" isVisible tools={TOOLS} />
                </Card>
              </VStack>
              <VStack gap={2}>
                <Text muted size={1} weight="medium">
                  appearance menu (system selected)
                </Text>
                <AppearanceMenu setScheme={NOOP} />
              </VStack>
            </VStack>
          </Card>
        </ColorSchemeProvider>
      </RouterProvider>
    </TestWrapper>
  )
}
