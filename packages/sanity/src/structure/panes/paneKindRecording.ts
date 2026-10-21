import {
  recordStructurePaneKind,
  type StructurePaneKind,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import {type PaneNode} from '../types'
import {toRegistryPath} from './toRegistryPath'

const PANE_TYPE_TO_SOFT_NAV_KIND = {
  component: 'other',
  document: 'document',
  documentList: 'list',
  list: 'list',
} satisfies Record<PaneNode['type'], StructurePaneKind>

/** @internal */
export function recordResolvedPaneKind(path: string, paneType: PaneNode['type']): void {
  recordStructurePaneKind(toRegistryPath(path), PANE_TYPE_TO_SOFT_NAV_KIND[paneType] ?? 'other')
}
