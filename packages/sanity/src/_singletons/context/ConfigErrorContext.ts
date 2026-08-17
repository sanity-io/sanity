import {createContext} from 'sanity/_createContext'

import type {ConfigErrorClassification} from '../../core/studio/requestErrors/classify'

/**
 * A workspace configuration error (missing project / dataset) detected
 * during boot by `WorkspacesProvider`'s request handler. Surfaced through
 * context so it can be rendered lower in the tree — below
 * `ActiveWorkspaceMatcher` — where the workspace-switcher hooks are
 * available.
 *
 * @internal
 */
export interface ConfigErrorValue {
  error: ConfigErrorClassification
  isStaging: boolean
  projectId?: string
  dataset?: string
}

/** @internal */
export const ConfigErrorContext = createContext<ConfigErrorValue | null>(
  'sanity/_singletons/context/config-error',
  null,
)
