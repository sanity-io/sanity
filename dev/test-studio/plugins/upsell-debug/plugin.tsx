import {useEffect} from 'react'
import {definePlugin, type LayoutProps, useWorkspace} from 'sanity'

import {installUpsellScenarioFetch, scenarioAtLoad, scenarioForPath} from './scenarios'

if (typeof window === 'object' && typeof window.fetch === 'function') {
  installUpsellScenarioFetch()
}

function UpsellDebugLayout(props: LayoutProps) {
  const {basePath} = useWorkspace()

  useEffect(() => {
    if (scenarioForPath(basePath) === scenarioAtLoad) return
    window.location.reload()
  }, [basePath])

  return props.renderDefault(props)
}

export const upsellDebug = definePlugin({
  name: 'upsell-debug',
  studio: {
    components: {
      layout: UpsellDebugLayout,
    },
  },
})
