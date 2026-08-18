/**
 * A warning about divergent `auth` configs across workspaces for the same
 * project. Collected at prepareConfig time and surfaced by the studio UI in
 * dev mode via `ConfigIssuesButton`.
 *
 * @internal
 */
export interface ProjectAuthDivergenceWarning {
  type: 'project-auth-divergence'
  projectId: string
  /** Grouped workspace names, one array per distinct auth config shape. */
  groups: string[][]
  /** Human-readable message suitable for console output or a UI surface. */
  message: string
}

/** @internal */
export type ConfigWarning = ProjectAuthDivergenceWarning

const collected: ConfigWarning[] = []

/** @internal */
export function recordConfigWarning(warning: ConfigWarning): void {
  collected.push(warning)
}

/** @internal */
export function getCollectedConfigWarnings(): ReadonlyArray<ConfigWarning> {
  return collected
}
