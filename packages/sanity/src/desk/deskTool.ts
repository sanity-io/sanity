import {MasterDetailIcon} from '@sanity/icons'
import {lazy} from 'react'
import {
  DeleteAction,
  DiscardChangesAction,
  DuplicateAction,
  HistoryRestoreAction,
  PublishAction,
  UnpublishAction,
} from './documentActions'
import {LiveEditBadge} from './documentBadges'
import {getIntentState} from './getIntentState'
import {router} from './router'
import {DeskToolOptions} from './types'
import {comments} from './comments'
import {wrapIconInDeskRenamePrompt} from './deskRename/deskRenamedIcon'
import {changesInspector} from './panes/document/inspectors/changes'
import {deskUsEnglishLanguageBundle} from './i18n'
import {validationInspector} from './panes/document/inspectors/validation'
import {definePlugin} from 'sanity'

const documentActions = [
  PublishAction,
  UnpublishAction,
  DiscardChangesAction,
  DuplicateAction,
  DeleteAction,
  HistoryRestoreAction,
]

const documentBadges = [LiveEditBadge]

const inspectors = [validationInspector, changesInspector]

/**
 * The deskTool is a studio plugin which adds the “desk tool” – a tool within Sanity Studio in which
 * content editors can drill down to specific documents to edit them.
 * You can configure your Studio's desk tool(s).
 *
 * @public
 * @param options - Options for the desk tool. See {@link DeskToolOptions}
 * @example Minimal example
 * ```ts
 * // sanity.config.ts
 * import { defineConfig } from 'sanity'
 * import { deskTool } from 'sanity/desk'
 *
 * export default defineConfig((
 *  // ...
 *  plugins: [
 *    deskTool() // use defaults
 *  ]
 * })
 * ```
 *
 * @example To customise your desk tool
 * ```ts
 * // sanity.config.ts
 * import { defineConfig } from 'sanity'
 * import { deskTool } from 'sanity/desk'
 * import { FaCar } from 'react-icons'

 * export default defineConfig((
 *	 // ...
 *   plugins: [
 *    deskTool({
 *      name: 'cars',
 *      title: 'Cars',
 *      icon: FaCar,
 *      structure: (S) => S.documentTypeList('car'),
 *      defaultDocumentNode: (S) =>
 *        S.document().views([
 *          S.view.form(),
 *          S.view.component(Preview).title('Preview')
 *        ])
 *    })
 *  ]
 * })
 * ```
 * */
export const deskTool = definePlugin<DeskToolOptions | void>((options) => {
  const hasSpecifiedName = options ? typeof options.name === 'string' : false
  const ToolIcon = options?.icon || MasterDetailIcon
  const icon = hasSpecifiedName ? ToolIcon : wrapIconInDeskRenamePrompt(ToolIcon)

  return {
    name: '@sanity/desk-tool',
    document: {
      actions: (prevActions) => {
        // NOTE: since it's possible to have several desk tools in one Studio,
        // we need to check whether the document actions already exist in the Studio config
        return Array.from(new Set([...prevActions, ...documentActions]))
      },
      badges: (prevBadges) => {
        // NOTE: since it's possible to have several desk tools in one Studio,
        // we need to check whether the document badges already exist in the Studio config
        return Array.from(new Set([...prevBadges, ...documentBadges]))
      },
      inspectors: (prevInspectors) => {
        // NOTE: since it's possible to have several desk tools in one Studio,
        // we need to check whether the inspectors already exist in the Studio config
        return Array.from(new Set([...prevInspectors, ...inspectors]))
      },
    },

    plugins: [comments()],

    tools: [
      {
        name: options?.name || 'structure',
        title: options?.title || 'Structure',
        icon,
        component: lazy(() => import('./components/deskTool')),
        canHandleIntent: (intent, params) => {
          if (intent === 'create') return canHandleCreateIntent(params)
          if (intent === 'edit') return canHandleEditIntent(params)
          return false
        },
        getIntentState,
        // Controlled by sanity/src/desk/components/deskTool/DeskTitle.tsx
        controlsDocumentTitle: true,
        options,
        router,
      },
    ],

    i18n: {
      bundles: [deskUsEnglishLanguageBundle],
    },
  }
})

function canHandleCreateIntent(params: Record<string, unknown>) {
  // We can't handle create intents without a `type` parameter
  if (!('type' in params)) {
    return false
  }

  // We can handle any create intent as long as it has a `type` parameter,
  // but we also know how to deal with templates, where other tools might not
  return 'template' in params ? {template: true} : true
}

function canHandleEditIntent(params: Record<string, unknown>) {
  // We can't handle edit intents without an `id` parameter
  if (!('id' in params)) {
    return false
  }

  // We can handle any edit intent with a document ID, but we're best at `structure` mode
  // This ensures that other tools that can handle modes such as `presentation` or `batch`
  // can take precedence over the desk tool
  return 'mode' in params ? {mode: params.mode === 'structure'} : true
}
