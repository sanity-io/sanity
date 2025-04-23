import {definePlugin} from '../config'
import {EditInCanvasAction} from './actions/EditInCanvas/EditInCanvasAction'
import {LinkToCanvasAction} from './actions/LinkToCanvas/LinkToCanvasAction'
import {UnlinkFromCanvasAction} from './actions/UnlinkFromCanvas/UnlinkFromCanvasAction'
import {CanvasDocumentLayout} from './CanvasDocumentLayout'
import {canvasUsEnglishLocaleBundle} from './i18n'

export const CANVAS_INTEGRATION_NAME = 'sanity/canvas-integration'

export const canvasIntegration = definePlugin(() => {
  return {
    name: CANVAS_INTEGRATION_NAME,
    i18n: {
      bundles: [canvasUsEnglishLocaleBundle],
    },

    document: {
      components: {
        unstable_layout: CanvasDocumentLayout,
      },
      actions: (prev) => {
        return prev.flatMap((action) =>
          action.action === 'publish'
            ? [action, LinkToCanvasAction, UnlinkFromCanvasAction, EditInCanvasAction]
            : action,
        )
      },
    },
  }
})
