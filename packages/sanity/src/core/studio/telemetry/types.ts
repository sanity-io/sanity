/**
 * Context object attached to each telemetry event for enrichment.
 * @internal
 */
export interface TelemetryContext {
  // Static (captured once on mount)
  /** Browser user agent string */
  userAgent: string
  /** Screen and viewport dimensions */
  screen: {
    density: number
    height: number
    width: number
    innerHeight: number
    innerWidth: number
  }
  /** Sanity Studio version */
  studioVersion: string
  /** React version */
  reactVersion: string
  /** Environment: production or development */
  environment: 'production' | 'development'
  /** Browser network quality, when available */
  connection: {
    effectiveType: string | null
    downlink: number | null
    rtt: number | null
    saveData: boolean | null
  } | null

  // Dynamic (updated on navigation/context changes)
  /** Organization ID (null if not yet loaded) */
  orgId: string | null
  /** Currently active tool name */
  activeTool: string | undefined
  /** Total number of configured workspaces */
  workspaceCount: number
  /** Current workspace name */
  activeWorkspace: string
  /** Current project ID */
  activeProjectId: string
  /** Current dataset name */
  activeDataset: string
  /** Total number of configured plugins in the active workspace, including nested plugins */
  pluginCount: number
  /** Total number of compiled schema types in the active workspace */
  schemaTypeCount: number
}
