import {Workshop} from '@sanity/ui-workshop'
import {type Tool, useColorSchemeSetValue, useColorSchemeValue, useWorkspace} from 'sanity'

import {config} from './config'
import {type WorkshopOptions} from './types'
import {useLocationStore} from './useLocationStore'

export function WorkshopTool(props: {tool: Tool<WorkshopOptions>}) {
  const {tool} = props
  const toolName = tool.options?.name || 'workshop'

  const scheme = useColorSchemeValue()
  const setScheme = useColorSchemeSetValue()
  const {basePath} = useWorkspace()

  const locationStore = useLocationStore({
    baseUrl: `${basePath}/${toolName}`,
  })

  return (
    <Workshop
      config={config}
      locationStore={locationStore}
      onSchemeChange={
        setScheme ||
        (() => {
          console.warn('Unable to change theme scheme')
        })
      }
      scheme={scheme}
    />
  )
}
