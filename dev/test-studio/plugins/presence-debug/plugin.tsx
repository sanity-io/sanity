import {definePlugin, type LayoutProps} from 'sanity'

import {PresenceDebugProvider} from './context'
import {presenceDebugFieldAction} from './fieldAction'

const DOCUMENT_TYPES = ['presenceDebug']

function PresenceDebugLayout(props: LayoutProps) {
  return <PresenceDebugProvider>{props.renderDefault(props)}</PresenceDebugProvider>
}

/**
 * Adds a "Fake presence here" field action to the `presenceDebug` document type: pick a user and
 * they show up as present at that field, or at your cursor inside a Portable Text field. Uses the
 * presence store's debug API, so the fake sessions go through the real presence code path.
 */
export const presenceDebug = definePlugin({
  name: 'presence-debug',
  studio: {
    components: {
      layout: PresenceDebugLayout,
    },
  },
  document: {
    unstable_fieldActions: (prev, {documentType}) =>
      DOCUMENT_TYPES.includes(documentType) ? [...prev, presenceDebugFieldAction] : prev,
  },
})
