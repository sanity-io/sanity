import {defineEvent} from '@sanity/telemetry'

/**
 * When a focus document pane button is clicked
 */
export const FocusDocumentPaneClicked = defineEvent({
  name: 'Maximised Document Pane Clicked',
  version: 1,
  description: 'User pressed to maximise a document by click the focus pane button',
})

/**
 * When a focus document pane button is collapsed
 */
export const FocusDocumentPaneCollapsed = defineEvent({
  name: 'Maximised Document Pane Collapsed',
  version: 1,
  description:
    'User disabled the maximisation on a document pane by clicking the focus pane button',
})

export const FocusDocumentPaneNavigated = defineEvent({
  name: 'Maximised Document Pane Navigated Via Breadcrumbs',
  version: 1,
  description:
    'User navigated to a different document pane via the breadcrumbs in the document header',
})
