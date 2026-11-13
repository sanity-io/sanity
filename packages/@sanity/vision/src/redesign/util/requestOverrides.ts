import {type ClientPerspective} from '@sanity/client'

import {type RequestEnvironment, resolveRequestOptions} from '../hooks/useResolvedRequest'
import {type VisionTabOptions} from '../store/types'

/** The tab options that send something other than what the studio has selected globally */
export interface RequestOverrides {
  /** Set when the tab queries another dataset than the workspace's */
  dataset: {dataset: string; workspaceDataset: string} | undefined
  /** Set when the tab's perspective resolves to other documents than the navbar's */
  perspective: boolean
  /** Set when the tab sends another variant than the navbar's (the tab only opts out of it) */
  variant: {globalVariant: string} | undefined
}

/** A one-element stack asks for the same documents as that perspective on its own */
function normalizePerspective(perspective: ClientPerspective | undefined): string {
  if (Array.isArray(perspective)) {
    return perspective.length === 1 ? perspective[0] : JSON.stringify(perspective)
  }
  return perspective ?? ''
}

/**
 * Compares the tab's resolved request with the one it would send if it followed the studio:
 * the workspace dataset, the navbar's perspective and the navbar's variant
 */
export function getRequestOverrides(
  options: VisionTabOptions,
  environment: RequestEnvironment,
): RequestOverrides {
  const tab = resolveRequestOptions(options, environment)
  const global = resolveRequestOptions(
    {...options, datasetMode: 'workspace', perspective: 'global', variant: 'global'},
    environment,
  )

  return {
    dataset:
      tab.dataset === environment.workspaceDataset
        ? undefined
        : {dataset: tab.dataset, workspaceDataset: environment.workspaceDataset},
    perspective: normalizePerspective(tab.perspective) !== normalizePerspective(global.perspective),
    variant:
      global.variant && tab.variant !== global.variant
        ? {globalVariant: global.variant}
        : undefined,
  }
}
