import {useMemo} from 'react'
import {definePlugin, type NavbarProps} from 'sanity'

import {CorsCheckButton} from './CorsCheckButton'

type NavbarActions = NonNullable<NavbarProps['__internal_actions']>

const EMPTY_ACTIONS: NavbarActions = []

const corsCheckActions: NavbarActions = [
  {location: 'topbar', name: 'cors-check-debug', render: CorsCheckButton},
  // The topbar drops its actions on narrow viewports, e.g. with devtools docked to the side
  {location: 'sidebar', name: 'cors-check-debug-sidebar', render: CorsCheckButton},
]

function CorsCheckNavbar(props: NavbarProps) {
  const prevActions = props.__internal_actions ?? EMPTY_ACTIONS
  const actions = useMemo(() => [...prevActions, ...corsCheckActions], [prevActions])

  return props.renderDefault({...props, __internal_actions: actions})
}

/**
 * Adds a "Check CORS" button to the navbar that sends the `/check/cors` request the Presentation
 * tool's live events client sends before it reconnects
 */
export const corsCheckDebug = definePlugin({
  name: 'cors-check-debug',
  studio: {
    components: {
      navbar: CorsCheckNavbar,
    },
  },
})
