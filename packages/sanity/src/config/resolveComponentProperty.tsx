import React, {Fragment} from 'react'
import {
  PluginOptions,
  ResolveComponentReturnType,
  SourceOptions,
  StudioComponentOptionNames,
} from './types'

const EMPTY_ARRAY: [] = []

function getComponentsFromPlugins(
  plugins: PluginOptions[],
  propertyName: StudioComponentOptionNames
): (ResolveComponentReturnType | undefined)[] {
  return plugins
    ?.map((p) => {
      const nested = getComponentsFromPlugins(p?.plugins || EMPTY_ARRAY, propertyName)

      return [p?.studio?.components?.[propertyName], ...nested]
    })
    .flat()
    .filter(Boolean)
}

interface ResolveComponentPropertyProps {
  children: React.ReactElement
  config: SourceOptions
  propertyName: StudioComponentOptionNames
}

export function resolveComponentProperty(props: ResolveComponentPropertyProps) {
  const {config, propertyName, children} = props
  const pluginComponents = getComponentsFromPlugins(config?.plugins || EMPTY_ARRAY, propertyName)

  const ConfigComponent = config.studio?.components?.[propertyName] || Fragment
  const defaultComponent = <ConfigComponent>{children}</ConfigComponent>

  if (pluginComponents.length > 0) {
    return (
      <Fragment>
        {pluginComponents.reduce((prev, curr) => {
          const CurrentPluginElement = curr || Fragment

          return <CurrentPluginElement>{prev}</CurrentPluginElement>
        }, defaultComponent)}
      </Fragment>
    )
  }

  return defaultComponent
}
