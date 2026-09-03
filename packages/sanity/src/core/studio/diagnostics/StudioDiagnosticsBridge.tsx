import {useEffect, useMemo, version as reactVersion} from 'react'

import {useClient} from '../../hooks/useClient'
import {SANITY_VERSION} from '../../version'
import {useWorkspace} from '../workspace'
import {useWorkspaces} from '../workspaces/useWorkspaces'
import {
  gatherStudioDiagnostics,
  type StudioDiagnostics,
  type StudioDiagnosticsOptions,
} from './gatherStudioDiagnostics'
import {getSchemaDiagnostics, getUniqueTargetCount} from './getStudioConfigurationDiagnostics'
import {studioRequestPerformance} from './requestPerformance'

const DIAGNOSTICS_API_VERSION = '2025-02-19'

/** @internal */
export interface StudioDiagnosticsBridgeApi {
  gather: (options?: {requestTimeout?: number}) => Promise<StudioDiagnostics>
}

/**
 * The window property {@link StudioDiagnosticsBridge} installs its API under.
 *
 * @internal
 */
export const STUDIO_DIAGNOSTICS_BRIDGE_KEY = '__sanityStudioDiagnostics'

type BridgeWindow = Window & {[STUDIO_DIAGNOSTICS_BRIDGE_KEY]?: StudioDiagnosticsBridgeApi}

/**
 * Headless component that exposes {@link gatherStudioDiagnostics} on
 * `window.__sanityStudioDiagnostics`, wired to the active workspace exactly like the
 * help-menu Diagnostics dialog. Automated tooling — e.g. the e2e suite capturing a
 * diagnostics report when a test fails — mounts it to gather the report without having
 * to drive the navbar UI, which may not be operable in the failure states the report is
 * meant to explain. The reports it produces are `parseStudioDiagnostics`-compatible.
 *
 * @internal
 */
export function StudioDiagnosticsBridge(): null {
  const {basePath, currentUser, dataset, name, projectId, schema, title} = useWorkspace()
  const workspaces = useWorkspaces()
  const client = useClient({apiVersion: DIAGNOSTICS_API_VERSION})

  const gather = useMemo(() => {
    const options: StudioDiagnosticsOptions = {
      client,
      getRequestHistory: studioRequestPerformance.getSnapshot,
      schema: getSchemaDiagnostics(schema),
      studio: {
        basePath,
        dataset,
        projectId,
        reactVersion,
        uniqueTargetCount: getUniqueTargetCount(workspaces),
        version: SANITY_VERSION,
        workspaceCount: workspaces.length,
        workspaceName: name,
        workspaceTitle: title,
      },
      user: currentUser,
    }

    return (overrides?: {requestTimeout?: number}) =>
      gatherStudioDiagnostics({...options, requestTimeout: overrides?.requestTimeout})
  }, [basePath, client, currentUser, dataset, name, projectId, schema, title, workspaces])

  useEffect(() => {
    const bridgeWindow = window as BridgeWindow
    const api: StudioDiagnosticsBridgeApi = {gather}
    bridgeWindow[STUDIO_DIAGNOSTICS_BRIDGE_KEY] = api

    return () => {
      if (bridgeWindow[STUDIO_DIAGNOSTICS_BRIDGE_KEY] === api) {
        delete bridgeWindow[STUDIO_DIAGNOSTICS_BRIDGE_KEY]
      }
    }
  }, [gather])

  return null
}
