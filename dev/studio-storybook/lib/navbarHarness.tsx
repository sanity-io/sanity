import {Box, Card, Flex, useRootTheme} from '@sanity/ui'
import {type ReactNode, useMemo} from 'react'
import {
  ColorSchemeSetValueContext,
  ColorSchemeValueContext,
  UserColorManagerContext,
} from 'sanity/_singletons'
import {route, RouterProvider} from 'sanity/router'

import {ActiveWorkspaceMatcherProvider} from '../../../packages/sanity/src/core/studio/activeWorkspaceMatcher/ActiveWorkspaceMatcherProvider'
import {type RouterHistory} from '../../../packages/sanity/src/core/studio/router'
import {useWorkspace} from '../../../packages/sanity/src/core/studio/workspace'
import {type WorkspacesContextValue} from '../../../packages/sanity/src/core/studio/workspaces'
import {createUserColorManager} from '../../../packages/sanity/src/core/user-color/manager'

/**
 * Navbar / studio-shell harness. Wrap a navbar story's content in `<NavbarProviders>` INSIDE a
 * `WithStudioProviders` decorator. The navbar chrome reaches for three contexts that
 * `WithStudioProviders` deliberately omits, so we seed them here, scoped to the story:
 *
 * - `ColorSchemeValue` / `ColorSchemeSetValue` - many navbar buttons call `useColorSchemeValue()`
 *   (HomeButton via active workspace, PresenceMenu, ConfigIssuesButton). We provide the raw
 *   context VALUE from the current `@sanity/ui` theme (not the `ColorSchemeProvider` component,
 *   which renders its own fixed-scheme ThemeProvider and would fight the story's light/dark
 *   toggle). Same lesson as the Canvas diff harness: seed the value, not the Provider.
 * - `ActiveWorkspaceMatcher` - HomeButton and others call `useActiveWorkspace()`. We use the
 *   workspace `WithStudioProviders` already built as the active one, with a stub history (the
 *   navbar chrome does not navigate in these isolated stories).
 *
 * The shared harness router is `route.intents('/intents')` (other stories depend on that), which
 * cannot resolve the root state links the navbar builds (HomeButton's `useStateLink({state:{}})`).
 * So NavbarProviders nests its own root `RouterProvider`, scoped to navbar stories only.
 *
 * currentUser-dependent pieces (UserMenu, the Search subsystem) need more and are a later wave.
 */
const noop = () => undefined

/**
 * The navbar needs BOTH kinds of link in one router:
 *  - root state links (`useStateLink({state: {}})`) from HomeButton and friends, which the shared
 *    intents-only harness router cannot resolve ("missing key");
 *  - intent links, which presence rows build to jump to the document a collaborator is editing
 *    ("Unable to find matching route for state ... intent, params, payload").
 * Each was found by opening a menu, not by rendering one. A root route with an intents child
 * resolves both.
 */
const navbarRoute = route.create('/', [route.intents('/intents')])

const stubHistory = {
  location: {pathname: '/', search: '', hash: '', state: null, key: 'stub'},
  listen: () => () => undefined,
  push: () => undefined,
  replace: () => undefined,
} as unknown as RouterHistory

export function NavbarProviders({children}: {children: ReactNode}) {
  const workspace = useWorkspace()
  const {scheme} = useRootTheme()
  // UserColorManager: the user avatars in UserMenu / PresenceMenu read a color per user id. Seed
  // the context value directly (built from the theme scheme), not the Provider, which calls
  // useColorSchemeValue and would demand the Studio scheme context. Same lesson as the Canvas diff.
  const userColorManager = useMemo(() => createUserColorManager({scheme}), [scheme])
  return (
    <ColorSchemeValueContext.Provider value={scheme}>
      <ColorSchemeSetValueContext.Provider value={noop}>
        <UserColorManagerContext.Provider value={userColorManager}>
          <ActiveWorkspaceMatcherProvider
            activeWorkspace={workspace as unknown as WorkspacesContextValue[number]}
            history={stubHistory}
            setActiveWorkspace={noop}
          >
            <RouterProvider router={navbarRoute} state={{}} onNavigate={noop}>
              {children}
            </RouterProvider>
          </ActiveWorkspaceMatcherProvider>
        </UserColorManagerContext.Provider>
      </ColorSchemeSetValueContext.Provider>
    </ColorSchemeValueContext.Provider>
  )
}

/**
 * Story frame for any navbar control that OPENS something.
 *
 * A menu button rendered into a `width: fit-content` card in the corner of a small canvas has
 * nowhere to put its popover: @sanity/ui shifts the menu on top of its own trigger and, once the
 * canvas is short, constrains the popover and truncates its contents. That reads to a reviewer as
 * "the menu is cropped", and it is a story-design defect rather than a component one - the real
 * navbar always has a full-width bar and a tall region beneath it.
 *
 * So overlay stories render the control where it actually lives: pinned in a full-width bar with
 * open space below for the menu to drop into. Pair with `parameters: {layout: 'fullscreen'}`.
 *
 * `align` puts the control at the bar's start or end - menus flip their alignment to stay on
 * screen, so a right-hand control (user, presence) is worth seeing on the right.
 */
export function NavbarStoryFrame({
  children,
  align = 'end',
  minHeight = 460,
}: {
  children: ReactNode
  align?: 'start' | 'end'
  minHeight?: number
}) {
  return (
    <Flex direction="column" style={{minHeight}}>
      <Card borderBottom paddingX={3} paddingY={2} tone="default">
        <Flex align="center" justify={align === 'end' ? 'flex-end' : 'flex-start'} gap={2}>
          {children}
        </Flex>
      </Card>
      {/* the room the popover needs; also shows where the menu lands relative to the bar */}
      <Box flex={1} />
    </Flex>
  )
}
