import {uuid} from '@sanity/uuid'
import {dequal} from 'dequal/lite'

import {EMPTY_PARAMS, type LOADING_PANE} from './constants'
import {type BaseIntentParams} from './structureBuilder/Intent'
import {type PaneNode, type RouterPanes, type RouterPaneSibling} from './types'

const state: {
  activePanes: Array<PaneNode | typeof LOADING_PANE>
} = {activePanes: []}

export function setActivePanes(panes: Array<PaneNode | typeof LOADING_PANE>): void {
  state.activePanes = panes
}

/**
 * This function looks at the _active panes_ to resolve an intent. this type of
 * intent resolution is faster and does not cause the panes to reset
 *
 * @internal
 */
export function getIntentState(
  intent: string,
  params: Record<string, string>,
  routerState: {panes?: RouterPanes} | undefined,
  payload: unknown,
  keepPanesOnCreate?: boolean,
): {panes: RouterPanes} | {intent: string; params: Record<string, string>; payload: unknown} {
  const panes = routerState?.panes || []
  const activePanes = state.activePanes || []
  const editDocumentId = params.id || uuid()

  // Loop through open panes and see if any of them can handle the intent
  for (let i = activePanes.length - 1; i >= 0; i--) {
    const pane = activePanes[i]

    if (typeof pane !== 'object') continue

    // NOTE: if you update this logic, please also update the similar handler in
    // `resolveIntent.ts`
    if (
      pane.canHandleIntent?.(intent, params, {
        pane,
        index: i,
      }) ||
      // see `resolveIntent.ts` for more info
      (pane.type === 'documentList' &&
        pane.schemaTypeName === params.type &&
        pane.options.filter === '_type == $type')
    ) {
      const paneParams = getPaneParams(intent, params)

      return {
        panes: panes
          .slice(0, i)
          .concat([[{id: editDocumentId, params: paneParams, payload}]]) as RouterPanes,
      }
    }

    // The intent matcher above declined, yet this pane's own header offers the
    // very create action being requested. That happens routinely in a nested
    // structure: `documentTypeList().child()` swaps the default intent handler
    // for `shallowIntentChecker`, which answers only for panes at index 0 or 1,
    // so every pane below the second declines. Left alone, the intent falls
    // through to `resolveIntent`, which searches the whole structure and -
    // finding no match - replaces the entire pane path with a lone editor, so
    // the editor loses their place in the tree.
    //
    // Since the affordance lives on this pane, this pane's path is where the
    // document belongs: open it as this pane's child, closing panes beyond it,
    // exactly as opening an existing document from a list does.
    if (
      keepPanesOnCreate &&
      intent === 'create' &&
      // The fallback editor cannot render without a type, and `IntentResolver`
      // is the only place a missing one gets recovered (it asks the document
      // store, see `ensureDocumentIdAndType`).
      typeof params.type === 'string' &&
      params.type.length > 0 &&
      paneOffersCreateIntent(pane, params, payload)
    ) {
      return {
        panes: [...panes.slice(0, i), [getFallbackEditorPane(editDocumentId, params, payload)]],
      }
    }
  }

  return {intent: intent, params, payload}
}

/**
 * Whether this pane's header offers the create action the intent describes.
 *
 * Mirrors how `PaneHeaderActions` builds the pane's create button, from two
 * sources, keyed by template id and falling back to the document type name:
 *
 * - the pane's own `initialValueTemplates`. Only `documentList` panes are
 *   considered, because only `DocumentListPaneHeader` forwards them to
 *   `PaneHeaderActions`. A `list` pane also serializes the field, but its
 *   header ignores it, so no button exists for it to have come from.
 * - every menu item carrying a `create` intent, which is the only way a
 *   hand-built `S.list()` can offer one.
 *
 * The template parameters have to match too. In a page tree every level offers
 * the same template and differs only in its parameters (the parent id), so
 * without this the search - which runs deepest pane first - would claim an
 * ancestor pane's "create" for whichever descendant happens to be open.
 */
function paneOffersCreateIntent(
  pane: PaneNode,
  params: Record<string, string>,
  payload: unknown,
): boolean {
  const requested = params.template || params.type
  if (!requested) return false

  if (pane.type === 'documentList') {
    const offered = (pane.initialValueTemplates ?? []).some(
      (template) =>
        template.templateId === requested && sameTemplateParameters(template.parameters, payload),
    )
    if (offered) return true
  }

  return (pane.menuItems ?? []).some((menuItem) => {
    if (menuItem.intent?.type !== 'create') return false

    // `Intent.params` is either the intent params alone, or a tuple of those
    // and the template parameters, which travel as the intent's payload.
    const [intentParams, templateParameters]: [BaseIntentParams | undefined, unknown] =
      Array.isArray(menuItem.intent.params)
        ? [menuItem.intent.params[0], menuItem.intent.params[1]]
        : [menuItem.intent.params, undefined]

    return (
      (intentParams?.template || intentParams?.type) === requested &&
      sameTemplateParameters(templateParameters, payload)
    )
  })
}

/**
 * Compares an affordance's template parameters with the intent payload that
 * carries them, treating "absent" and "empty" as the same thing: a create
 * action without parameters sends no payload at all.
 */
function sameTemplateParameters(parameters: unknown, payload: unknown): boolean {
  if (isEmptyParameters(parameters) && isEmptyParameters(payload)) return true
  return dequal(parameters, payload)
}

function isEmptyParameters(value: unknown): boolean {
  if (value === undefined || value === null) return true
  return typeof value === 'object' && Object.keys(value).length === 0
}

/**
 * Builds the router pane for the implicit fallback document editor, the same
 * pane `resolveIntent` falls back to when the intent matches nothing in the
 * structure.
 *
 * The `__edit__` prefix is what makes it a document editor: it is intercepted
 * by `fallbackEditorChild` in `createResolvedPaneNodeStream` at any depth,
 * regardless of the parent pane's `child` resolver. That matters here, because
 * a pane reached this far by declining the intent - so its `child` resolver
 * cannot be trusted to open the document. A `documentTypeList` with a custom
 * `.child()` opens that child pane instead (sanity-io/sanity#8861).
 */
function getFallbackEditorPane(
  documentId: string,
  params: Record<string, string>,
  payload: unknown,
): RouterPaneSibling {
  // `id` identifies the document and is carried by the pane id itself. Every
  // other param is forwarded, mirroring `resolveIntent`'s fallback - notably
  // `type`, which the fallback editor requires, plus `template` and `version`.
  const {id: _id, ...rest} = params

  return {
    id: `__edit__${documentId}`,
    params: rest,
    payload,
  }
}

function getPaneParams(intent: string, params: Record<string, string>): Record<string, string> {
  switch (intent) {
    case 'create':
      return {template: params.template, version: params.version}
    case 'edit': {
      // Forward every param except those that identify the document (`id`/`type`) or
      // are create-only (`template`). This mirrors the cold-path resolver
      // (`resolveIntent`), which rest-spreads `otherParams`. Keeping the two in sync
      // structurally is important: a hardcoded allow-list silently drops any newly
      // added edit-intent param (this is exactly how `path` was being lost).
      const {id: _id, type: _type, template: _template, ...rest} = params
      return rest
    }
    default:
      return EMPTY_PARAMS
  }
}
