import {DOCUMENT_GROUP_INSPECTOR_NAME} from '../../panes/document/constants'

/**
 * The parent pane's params a document opened from one of its references carries over: the
 * document group inventory, so the inventory follows you to the new pane. The parent keeps its
 * own; on a narrow window Studio collapses the parent pane, inventory included.
 *
 * @internal
 */
export function getInheritedChildParams(
  parentParams: Record<string, string | undefined> | undefined,
): {inspect?: string} {
  return parentParams?.inspect === DOCUMENT_GROUP_INSPECTOR_NAME
    ? {inspect: DOCUMENT_GROUP_INSPECTOR_NAME}
    : {}
}
