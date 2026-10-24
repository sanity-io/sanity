import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {rgba} from '@sanity/ui/theme'
import {useInsertionEffect, useState} from 'react'

import {
  GLOBAL_STYLES_ATTRIBUTE,
  GLOBAL_STYLES_BUILD_ID,
  GLOBAL_STYLE_VARIABLE_NAMES,
  GLOBAL_STYLE_VARIABLES,
  type GlobalStyleVariableName,
} from './globalStyleConstants'

interface InitialVariable {
  priority: string
  value: string
}

interface GlobalStyleInstance {
  buildId: string
  variables?: GlobalStyleVariables
}

interface GlobalStyleRegistry {
  initialAttributeValue: string | null
  initialVariables: Map<GlobalStyleVariableName, InitialVariable>
  instances: Map<symbol, GlobalStyleInstance>
  root: HTMLElement
}

type GlobalStyleVariables = Record<GlobalStyleVariableName, string>

const GLOBAL_STYLE_REGISTRY = Symbol.for('sanity.globalStyleRegistry.v1')

interface GlobalStyleRegistryDocument extends Document {
  [GLOBAL_STYLE_REGISTRY]?: GlobalStyleRegistry
}

// Construct a resize handle icon as a data URI, to be displayed in browsers that support the `::-webkit-resizer` selector.
function buildResizeHandleDataUri(hexColor: string) {
  const encodedStrokeColor = encodeURIComponent(hexColor)
  const encodedSvg = `%3Csvg width='9' height='9' viewBox='0 0 9 9' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 8L8 1' stroke='${encodedStrokeColor}' stroke-linecap='round'/%3E%3Cpath d='M5 8L8 5' stroke='${encodedStrokeColor}' stroke-linecap='round'/%3E%3C/svg%3E%0A`
  return `url("data:image/svg+xml,${encodedSvg}")`
}

function restoreVariable(root: HTMLElement, name: string, initial: InitialVariable) {
  if (initial.value) {
    root.style.setProperty(name, initial.value, initial.priority)
  } else {
    root.style.removeProperty(name)
  }
}

function applyVariables(registry: GlobalStyleRegistry, variables: GlobalStyleVariables) {
  for (const [name, initial] of registry.initialVariables) {
    if (Object.hasOwn(variables, name)) {
      registry.root.style.setProperty(name, variables[name])
    } else {
      restoreVariable(registry.root, name, initial)
    }
  }
}

function restoreVariables(registry: GlobalStyleRegistry) {
  for (const [name, initial] of registry.initialVariables) {
    restoreVariable(registry.root, name, initial)
  }
}

function captureInitialVariables(
  registry: GlobalStyleRegistry,
  variableNames: readonly GlobalStyleVariableName[],
) {
  for (const name of variableNames) {
    if (registry.initialVariables.has(name)) continue

    registry.initialVariables.set(name, {
      priority: registry.root.style.getPropertyPriority(name),
      value: registry.root.style.getPropertyValue(name),
    })
  }
}

function getLatestInstance(instances: Map<symbol, GlobalStyleInstance>) {
  let latest: GlobalStyleInstance | undefined

  for (const instance of instances.values()) {
    latest = instance
  }

  return latest
}

function applyInstance(registry: GlobalStyleRegistry, instance: GlobalStyleInstance) {
  registry.root.setAttribute(GLOBAL_STYLES_ATTRIBUTE, instance.buildId)

  if (instance.variables) {
    applyVariables(registry, instance.variables)
  } else {
    restoreVariables(registry)
  }
}

function registerGlobalStyles(ownerDocument: Document, instanceId: symbol) {
  const root = ownerDocument.documentElement
  const registryDocument = ownerDocument as GlobalStyleRegistryDocument
  let registry = registryDocument[GLOBAL_STYLE_REGISTRY]

  if (!registry) {
    registry = {
      initialAttributeValue: root.getAttribute(GLOBAL_STYLES_ATTRIBUTE),
      initialVariables: new Map(),
      instances: new Map(),
      root,
    }
    registryDocument[GLOBAL_STYLE_REGISTRY] = registry
  }

  captureInitialVariables(registry, GLOBAL_STYLE_VARIABLE_NAMES)
  const instance = {buildId: GLOBAL_STYLES_BUILD_ID}
  registry.instances.set(instanceId, instance)
  applyInstance(registry, instance)

  return () => {
    const currentRegistry = registryDocument[GLOBAL_STYLE_REGISTRY]

    if (!currentRegistry?.instances.delete(instanceId)) return

    const latestInstance = getLatestInstance(currentRegistry.instances)
    if (latestInstance) {
      applyInstance(currentRegistry, latestInstance)
      return
    }

    restoreVariables(currentRegistry)

    if (currentRegistry.initialAttributeValue === null) {
      currentRegistry.root.removeAttribute(GLOBAL_STYLES_ATTRIBUTE)
    } else {
      currentRegistry.root.setAttribute(
        GLOBAL_STYLES_ATTRIBUTE,
        currentRegistry.initialAttributeValue,
      )
    }

    delete registryDocument[GLOBAL_STYLE_REGISTRY]
  }
}

function updateGlobalStyles(
  ownerDocument: Document,
  instanceId: symbol,
  variables: GlobalStyleVariables,
) {
  const registry = (ownerDocument as GlobalStyleRegistryDocument)[GLOBAL_STYLE_REGISTRY]
  const instance = registry?.instances.get(instanceId)
  if (!registry || !instance) return

  instance.variables = variables

  let latestInstanceId: symbol | undefined
  for (const id of registry.instances.keys()) {
    latestInstanceId = id
  }

  if (latestInstanceId === instanceId) {
    applyInstance(registry, instance)
  }
}

export function GlobalStyle(): null {
  const [instanceId] = useState(Symbol)
  const {color, font} = useThemeV2()
  const webkitResizerBackgroundImageValue = buildResizeHandleDataUri(color.icon)
  const selectionBackgroundColorValue = rgba(color.focusRing, 0.3)

  useInsertionEffect(() => registerGlobalStyles(document, instanceId), [instanceId])

  useInsertionEffect(() => {
    updateGlobalStyles(document, instanceId, {
      [GLOBAL_STYLE_VARIABLES.selectionBackgroundColor]: selectionBackgroundColorValue,
      [GLOBAL_STYLE_VARIABLES.uiColorBg]: color.bg,
      [GLOBAL_STYLE_VARIABLES.uiColorBorder]: color.border,
      [GLOBAL_STYLE_VARIABLES.uiColorMutedFg]: color.muted.fg,
      [GLOBAL_STYLE_VARIABLES.uiFontTextFamily]: font.text.family,
      [GLOBAL_STYLE_VARIABLES.uiFontTextWeightMedium]: font.text.weights.medium.toString(),
      [GLOBAL_STYLE_VARIABLES.webkitResizerBackgroundImage]: webkitResizerBackgroundImageValue,
    })
  }, [
    color.bg,
    color.border,
    color.muted.fg,
    font.text.family,
    font.text.weights.medium,
    instanceId,
    selectionBackgroundColorValue,
    webkitResizerBackgroundImageValue,
  ])

  return null
}
