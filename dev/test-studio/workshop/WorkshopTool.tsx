import {Tool, useColorScheme, useWorkspace} from 'sanity'
import {Workshop} from '@sanity/ui-workshop'
import {WorkshopOptions} from './types'
import {config} from './config'
import {useLocationStore} from './useLocationStore'

export function WorkshopTool(props: {tool: Tool<WorkshopOptions>}) {
  const {tool} = props
  const toolName = tool.options?.name || 'workshop'

  const {scheme, setScheme} = useColorScheme()
  const {basePath} = useWorkspace()

  const locationStore = useLocationStore({
    baseUrl: `${basePath}/${toolName}`,
  })

  return (
    <Workshop
      config={config}
      locationStore={locationStore}
      onSchemeChange={setScheme}
      scheme={scheme}
    />
  )
}
