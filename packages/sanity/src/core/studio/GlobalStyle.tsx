import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {rgba} from '@sanity/ui/theme'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useInsertionEffect, useState} from 'react'

import {GLOBAL_STYLES_ATTRIBUTE} from './globalStyleConstants'
import {
  selectionBackgroundColor,
  uiColorBg,
  uiColorBorder,
  uiColorMutedFg,
  uiFontTextFamily,
  uiFontTextWeightMedium,
  webkitResizerBackgroundImage,
} from './styles.css'

interface InitialVariable {
  priority: string
  value: string
}

interface GlobalStyleRegistry {
  initialAttributePresent: boolean
  initialVariables: Map<string, InitialVariable>
  instances: Map<symbol, Record<string, string> | undefined>
  root: HTMLElement
}

const registries = new WeakMap<Document, GlobalStyleRegistry>()
const globalStyleVariableNames = Object.keys(
  assignInlineVars({
    [selectionBackgroundColor]: '',
    [uiColorBg]: '',
    [uiColorBorder]: '',
    [uiColorMutedFg]: '',
    [uiFontTextFamily]: '',
    [uiFontTextWeightMedium]: '',
    [webkitResizerBackgroundImage]: '',
  }),
)

// Construct a resize handle icon as a data URI, to be displayed in browsers that support the `::-webkit-resizer` selector.
function buildResizeHandleDataUri(hexColor: string) {
  const encodedStrokeColor = encodeURIComponent(hexColor)
  const encodedSvg = `%3Csvg width='9' height='9' viewBox='0 0 9 9' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 8L8 1' stroke='${encodedStrokeColor}' stroke-linecap='round'/%3E%3Cpath d='M5 8L8 5' stroke='${encodedStrokeColor}' stroke-linecap='round'/%3E%3C/svg%3E%0A`
  return `url("data:image/svg+xml,${encodedSvg}")`
}

function applyVariables(root: HTMLElement, variables: Record<string, string>) {
  for (const [name, value] of Object.entries(variables)) {
    root.style.setProperty(name, value)
  }
}

function getLatestVariables(instances: Map<symbol, Record<string, string> | undefined>) {
  let latest: Record<string, string> | undefined

  for (const variables of instances.values()) {
    if (variables) latest = variables
  }

  return latest
}

function registerGlobalStyles(ownerDocument: Document, instanceId: symbol) {
  const root = ownerDocument.documentElement
  let registry = registries.get(ownerDocument)

  if (!registry) {
    registry = {
      initialAttributePresent: root.hasAttribute(GLOBAL_STYLES_ATTRIBUTE),
      initialVariables: new Map(
        globalStyleVariableNames.map((name) => [
          name,
          {
            priority: root.style.getPropertyPriority(name),
            value: root.style.getPropertyValue(name),
          },
        ]),
      ),
      instances: new Map(),
      root,
    }
    registries.set(ownerDocument, registry)
  }

  registry.instances.set(instanceId, undefined)
  registry.root.setAttribute(GLOBAL_STYLES_ATTRIBUTE, '')

  return () => {
    const currentRegistry = registries.get(ownerDocument)

    if (!currentRegistry?.instances.delete(instanceId)) return

    const latestVariables = getLatestVariables(currentRegistry.instances)
    if (latestVariables) {
      applyVariables(currentRegistry.root, latestVariables)
      return
    }

    for (const [name, initial] of currentRegistry.initialVariables) {
      if (initial.value) {
        currentRegistry.root.style.setProperty(name, initial.value, initial.priority)
      } else {
        currentRegistry.root.style.removeProperty(name)
      }
    }

    if (!currentRegistry.initialAttributePresent) {
      currentRegistry.root.removeAttribute(GLOBAL_STYLES_ATTRIBUTE)
    }

    registries.delete(ownerDocument)
  }
}

function updateGlobalStyles(
  ownerDocument: Document,
  instanceId: symbol,
  variables: Record<string, string>,
) {
  const registry = registries.get(ownerDocument)
  if (!registry?.instances.has(instanceId)) return

  registry.instances.set(instanceId, variables)

  let latestInstanceId: symbol | undefined
  for (const id of registry.instances.keys()) {
    latestInstanceId = id
  }

  if (latestInstanceId === instanceId) {
    applyVariables(registry.root, variables)
  }
}

export function GlobalStyle(): null {
  const [instanceId] = useState(Symbol)
  const {color, font} = useThemeV2()
  const webkitResizerBackgroundImageValue = buildResizeHandleDataUri(color.icon)
  const selectionBackgroundColorValue = rgba(color.focusRing, 0.3)

  useInsertionEffect(() => registerGlobalStyles(document, instanceId), [instanceId])

  useInsertionEffect(() => {
    updateGlobalStyles(
      document,
      instanceId,
      assignInlineVars({
        [selectionBackgroundColor]: selectionBackgroundColorValue,
        [uiColorBg]: color.bg,
        [uiColorBorder]: color.border,
        [uiColorMutedFg]: color.muted.fg,
        [uiFontTextFamily]: font.text.family,
        [uiFontTextWeightMedium]: font.text.weights.medium.toString(),
        [webkitResizerBackgroundImage]: webkitResizerBackgroundImageValue,
      }),
    )
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
