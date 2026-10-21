import {type ComponentDef, type DesignOptionsConfig} from './types'

let config: DesignOptionsConfig | null = null
const subscribers = new Set<() => void>()

/** A project calls this once, from its registry module, before anything renders. */
export function defineDesignOptions(next: DesignOptionsConfig): DesignOptionsConfig {
  config = next
  subscribers.forEach((fn) => fn())
  return next
}

export function getConfig(): DesignOptionsConfig {
  if (!config)
    throw new Error('design-options: call defineDesignOptions(...) from the registry first')
  return config
}

export function getComponent(id: string): ComponentDef | undefined {
  return getConfig().components.find((component) => component.id === id)
}

/** An option that has no design at all: it cannot be chosen, and "Show" falls back to the default. */
export const NOT_DRAWN_LABEL = 'Not drawn'
