import {definePlugin} from '../config'
import {useEditInCanvasAction} from './actions/EditInCanvas/EditInCanvasAction'
import {useLinkToCanvasAction} from './actions/LinkToCanvas/LinkToCanvasAction'
import {useUnlinkFromCanvasAction} from './actions/UnlinkFromCanvas/UnlinkFromCanvasAction'
import {canvasUsEnglishLocaleBundle} from './i18n'

export const CANVAS_INTEGRATION_NAME = 'sanity/canvas-integration'

export const canvasIntegration = definePlugin(() => {
  return {
    name: CANVAS_INTEGRATION_NAME,
    i18n: {
      bundles: [canvasUsEnglishLocaleBundle],
    },

    document: {
      actions: (prev) => {
        return prev.flatMap((action) =>
          action.action === 'publish'
            ? [action, useLinkToCanvasAction, useUnlinkFromCanvasAction, useEditInCanvasAction]
            : action,
        )
      },
    },
  }
})
