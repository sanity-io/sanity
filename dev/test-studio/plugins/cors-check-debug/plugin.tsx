import {useMemo} from 'react'
import {definePlugin, type NavbarProps} from 'sanity'

import {CorsCheckButton} from './CorsCheckButton'
import {installCorsCheckInterceptor} from './interceptor'

type NavbarActions = NonNullable<NavbarProps['__internal_actions']>

const EMPTY_ACTIONS: NavbarActions = []

const corsCheckAction: NavbarActions[number] = {
  location: 'topbar',
  name: 'cors-check-debug',
  render: CorsCheckButton,
}

function CorsCheckNavbar(props: NavbarProps) {
  const prevActions = props.__internal_actions ?? EMPTY_ACTIONS
  const actions = useMemo(() => [...prevActions, corsCheckAction], [prevActions])

  return props.renderDefault({...props, __internal_actions: actions})
}

/**
 * Adds a "CORS" button to the navbar for reproducing the Presentation tool's `CorsOriginError`
 * after a reconnect: it calls `/check/cors`, drops the live connections the way sleep/wake does,
 * and can answer `/check/cors` the way the API answers a managed origin, so the crash reproduces
 * on localhost.
 */
export const corsCheckDebug = definePlugin(() => {
  installCorsCheckInterceptor()

  return {
    name: 'cors-check-debug',
    studio: {
      components: {
        navbar: CorsCheckNavbar,
      },
    },
  }
})
