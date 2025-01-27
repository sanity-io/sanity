import {type ReleaseId} from '@sanity/client'

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
   * Allows to override the global version with a specific version or release.
   * @beta
   */
  forcedVersion?: {
    selectedPerspectiveName: ReleaseId | 'published' | undefined
    isReleaseLocked: boolean
    selectedReleaseId: ReleaseId | undefined
  }
}
