import {type ComponentType} from 'react'

interface LazyComponentModule {
  default: ComponentType
}

interface ViteDevServerStoppedModules {
  detect: LazyComponentModule
  errorScreen: LazyComponentModule
}

let modulesPromise: Promise<ViteDevServerStoppedModules> | undefined

async function importViteDevServerStoppedModules(): Promise<ViteDevServerStoppedModules> {
  const [detect, errorScreen] = await Promise.all([
    import('./DetectViteDevServerStopped.lazy'),
    import('./DevServerStoppedErrorScreen.lazy'),
  ])

  return {detect, errorScreen}
}

function loadViteDevServerStoppedModules(): Promise<ViteDevServerStoppedModules> {
  modulesPromise ??= importViteDevServerStoppedModules()
  return modulesPromise
}

export async function loadDetectViteDevServerStopped(): Promise<LazyComponentModule> {
  return (await loadViteDevServerStoppedModules()).detect
}

export async function loadDevServerStoppedErrorScreen(): Promise<LazyComponentModule> {
  return (await loadViteDevServerStoppedModules()).errorScreen
}
