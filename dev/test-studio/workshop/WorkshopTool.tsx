import {Tool, useColorScheme, useWorkspace} from 'sanity'
import React from 'react'
import {Workshop} from '@sanity/ui-workshop'
import {WorkshopOptions} from './types'
import {config} from './config'
import {useLocationStore} from './useLocationStore'

export function WorkshopTool(props: {tool: Tool<WorkshopOptions>}) {
  const {tool} = props

  const {scheme, setScheme} = useColorScheme()
  const {basePath} = useWorkspace()

  const locationStore = useLocationStore({
    baseUrl: `${basePath}/${tool.options?.name || 'workshop'}`,
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
