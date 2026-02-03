import {type ReleaseId} from 'sanity'

import {type PaneNode} from '../types'

export interface BaseStructureToolPaneProps<T extends PaneNode['type']> {
  paneKey: string
  index: number
  itemId: string
  childItemId?: string
  isSelected?: boolean
  isActive?: boolean
  pane: Extract<PaneNode, {type: T}>
  /**
   * TODO: COREL - Remove this after updating sanity-assist to use <PerspectiveProvider>
   *
   * Allows to override the global version with a specific version or release.
   * @deprecated use <PerspectiveProvider> instead
   * @beta
   */
  forcedVersion?: {
    selectedPerspectiveName: ReleaseId | 'published' | undefined
    isReleaseLocked: boolean
    selectedReleaseId: ReleaseId | undefined
  }

  /**
   * @deprecated Avoid specifying a key, instead use `paneKey` if need be
   */
  key?: string
}
