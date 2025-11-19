import {definePlugin, DocumentActionComponent} from '../config'
import {EditInCanvasAction} from './actions/EditInCanvas/EditInCanvasAction'
import {LinkToCanvasAction} from './actions/LinkToCanvas/LinkToCanvasAction'
import {UnlinkFromCanvasAction} from './actions/UnlinkFromCanvas/UnlinkFromCanvasAction'
import {canvasUsEnglishLocaleBundle} from './i18n'

export const CANVAS_INTEGRATION_NAME = 'sanity/canvas-integration'

export const canvasIntegration = definePlugin(() => {
  return {
    name: CANVAS_INTEGRATION_NAME,
    i18n: {
      bundles: [canvasUsEnglishLocaleBundle],
    },

    document: {
      actions: (prev, context) => {
        if (context.versionType === 'draft' || context.versionType === 'version') {
          const deleteAndDiscardActionNames: DocumentActionComponent['action'][] = [
            'delete',
            'discardVersion',
          ]

          const deleteAndDiscardActions = prev.filter((action) =>
            deleteAndDiscardActionNames.includes(action.action),
          )
          const otherActions = prev.filter(
            (action) => !deleteAndDiscardActionNames.includes(action.action),
          )

          return [
            ...otherActions,
            LinkToCanvasAction,
            UnlinkFromCanvasAction,
            EditInCanvasAction,
            ...deleteAndDiscardActions,
          ]
        }

        return prev
      },
    },
  }
})
