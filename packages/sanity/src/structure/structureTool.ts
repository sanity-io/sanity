import {MasterDetailIcon} from '@sanity/icons'
import {lazy} from 'react'
import {definePlugin} from 'sanity'

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
import {structureUsEnglishLocaleBundle} from './i18n'
import {changesInspector} from './panes/document/inspectors/changes'
import {validationInspector} from './panes/document/inspectors/validation'
import {router} from './router'
import {type StructureToolOptions} from './types'

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
 * The structureTool is a studio plugin which adds the “structure tool” – a tool within
 * Sanity Studio in which content editors can drill down to specific documents to edit them.
 * You can configure your Studio's structure tool(s).
 *
 * @public
 * @param options - Options for the structure tool. See {@link StructureToolOptions}
 * @example Minimal example
 * ```ts
 * // sanity.config.ts
 * import { defineConfig } from 'sanity'
 * import { structureTool } from 'sanity/structure'
 *
 * export default defineConfig((
 *  // ...
 *  plugins: [
 *    structureTool() // use defaults
 *  ]
 * })
 * ```
 *
 * @example To customise your structure tool
 * ```ts
 * // sanity.config.ts
 * import { defineConfig } from 'sanity'
 * import { structureTool } from 'sanity/structure'
 * import { FaCar } from 'react-icons'

 * export default defineConfig((
 *	 // ...
 *   plugins: [
 *    structureTool({
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
export const structureTool = definePlugin<StructureToolOptions | void>((options) => {
  const icon = options?.icon || MasterDetailIcon

  return {
    name: 'sanity/structure',
    document: {
      actions: (prevActions) => {
        // NOTE: since it's possible to have several structure tools in one Studio,
        // we need to check whether the document actions already exist in the Studio config
        return Array.from(new Set([...prevActions, ...documentActions]))
      },
      badges: (prevBadges) => {
        // NOTE: since it's possible to have several structure tools in one Studio,
        // we need to check whether the document badges already exist in the Studio config
        return Array.from(new Set([...prevBadges, ...documentBadges]))
      },
      inspectors: (prevInspectors) => {
        // NOTE: since it's possible to have several structure tools in one Studio,
        // we need to check whether the inspectors already exist in the Studio config
        return Array.from(new Set([...prevInspectors, ...inspectors]))
      },
    },

    tools: [
      {
        name: options?.name || 'structure',
        title: options?.title || 'Structure',
        icon,
        component: lazy(() => import('./components/structureTool')),
        canHandleIntent: (intent, params) => {
          if (intent === 'create') return canHandleCreateIntent(params)
          if (intent === 'edit') return canHandleEditIntent(params)
          return false
        },
        getIntentState,
        // Controlled by sanity/src/structure/components/structureTool/StructureTitle.tsx
        controlsDocumentTitle: true,
        options,
        router,
        __internalApplicationType: 'sanity/structure',
      },
    ],

    i18n: {
      bundles: [structureUsEnglishLocaleBundle],
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
  // can take precedence over the structure tool
  return 'mode' in params ? {mode: params.mode === 'structure'} : true
}
