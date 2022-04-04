import {SanityTool, useColorScheme} from '@sanity/base'
import {Workshop} from '@sanity/ui-workshop'
import React from 'react'
import {WorkshopOptions} from './types'
import {config} from './config'
import {useLocationStore} from './useLocationStore'

export function WorkshopTool(props: {tool: SanityTool<WorkshopOptions>}) {
  const {tool} = props

  const {scheme, setScheme} = useColorScheme()

  const locationStore = useLocationStore({
    baseUrl: `/${tool.options.name || 'workshop'}`,
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
