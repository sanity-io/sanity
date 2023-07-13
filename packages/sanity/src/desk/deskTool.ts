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
export const deskTool = definePlugin<DeskToolOptions | void>((options) => ({
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
  tools: [
    {
      name: options?.name || 'desk',
      title: options?.title || 'Desk',
      icon: options?.icon || MasterDetailIcon,
      component: lazy(() => import('./components/deskTool')),
      canHandleIntent: (intent, params) => {
        return Boolean(
          (intent === 'edit' && params.id) ||
            (intent === 'create' && params.type) ||
            (intent === 'create' && params.template)
        )
      },
      getIntentState,
      options,
      router,
    },
  ],
  i18n: {
    bundles: [deskUsEnglishLanguageBundle],
  },
}))
