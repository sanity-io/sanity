import {SanityTool, useColorScheme} from '@sanity/base'
import {Workshop} from '@sanity/ui-workshop'
import React from 'react'
import {WorkshopOptions} from './types'
import {config} from './config'

export function WorkshopTool(props: {tool: SanityTool<WorkshopOptions>}) {
  const {tool} = props

  const {scheme, setScheme} = useColorScheme()

  return (
    <Workshop
      config={config}
      // TODO
      locationStore={{} as any}
      onSchemeChange={setScheme}
      scheme={scheme}
    />
  )
}
