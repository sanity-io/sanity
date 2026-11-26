import {defineEvent} from '@sanity/telemetry'

import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {isAgentBundleName} from '../../store/agent/createAgentBundlesStore'
import {getDocumentVersionVariantId} from '../../util/getDocumentVersionVariant'

/**
 * Where the inventory is rendered: the document inspector (Manage versions), or the version picker
 * of the compare versions view.
 */
export type DocumentGroupInventoryLocation = 'document_inspector' | 'compare_versions_menu'

interface DocumentGroupInventoryVersionSelectedInfo {
  location: DocumentGroupInventoryLocation
  bundle: InventoryVersionBundle
  /** Whether the version belongs to a content variant */
  isVariant: boolean
}

interface DocumentGroupInventoryVersionCreatedInfo {
  /**
   * `create_variant` is the inventory's Create variant form, the others are actions of a version's
   * context menu
   */
  action: 'create_variant' | 'add_to_release' | 'copy_to_drafts'
  /** Whether the created version belongs to a content variant */
  isVariant: boolean
}

type InventoryVersionBundle = 'published' | 'drafts' | 'release' | 'agent'

/**
 * Classifies a version by the bundle it lives in. Read from `_system` rather than the id, which
 * is opaque for variant versions.
 */
export function getInventoryVersionTelemetry(
  document: VersionInfoDocumentStub,
): Pick<DocumentGroupInventoryVersionSelectedInfo, 'bundle' | 'isVariant'> {
  const {bundleId} = document._system
  const isVariant = getDocumentVersionVariantId(document) !== undefined

  if (!bundleId) return {bundle: 'published', isVariant}
  if (bundleId === 'drafts') return {bundle: 'drafts', isVariant}
  if (isAgentBundleName(bundleId)) return {bundle: 'agent', isVariant}
  return {bundle: 'release', isVariant}
}

/** When a version's row is picked in the document group inventory */
export const DocumentGroupInventoryVersionSelected =
  defineEvent<DocumentGroupInventoryVersionSelectedInfo>({
    name: 'Document Group Inventory Version Selected',
    version: 1,
    description: 'User picked a version of the document in the document group inventory',
  })

/** When a version is successfully created from the document group inventory */
export const DocumentGroupInventoryVersionCreated =
  defineEvent<DocumentGroupInventoryVersionCreatedInfo>({
    name: 'Document Group Inventory Version Created',
    version: 1,
    description: 'User created a version of the document from the document group inventory',
  })
