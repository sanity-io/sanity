import {type I18nTextRecord} from '@sanity/types'

import {type DocumentFieldActionNode} from '../../config/document/fieldActions/types'
import {type Intent} from './intent'
import {type PaneMenuItem, type PaneMenuItemGroup} from './paneMenuItems'
import {type View} from './views'

/**
 * The minimal shape of a resolved document pane node, as consumed by the
 * document pane. The structure tool resolves a richer version of this node
 * (with `child` resolvers and intent checkers); embedders such as presentation
 * construct it directly.
 *
 * @internal
 */
export interface DocumentPaneNode {
  id: string
  type: 'document'
  title?: string
  i18n?: I18nTextRecord<'title'>
  menuItems?: PaneMenuItem[]
  menuItemGroups?: PaneMenuItemGroup[]
  options: {
    id: string
    type: string
    template?: string
    templateParameters?: Record<string, unknown>
  }
  source?: string
  views?: View[]
  /**
   * View IDs to open as split panes by default when the document is opened.
   * Only populated if 2+ valid view IDs are configured.
   */
  defaultPanes?: string[]
}

/**
 * @hidden
 * @beta */
export type DocumentFieldMenuActionNode = DocumentFieldActionNode & {
  intent?: Intent
}
