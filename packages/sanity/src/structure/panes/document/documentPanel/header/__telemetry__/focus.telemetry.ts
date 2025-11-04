import {defineEvent} from '@sanity/telemetry'

/**
 * When a focus document pane button is clicked
 */
export const FocusDocumentPaneClicked = defineEvent({
  name: 'Focus Document Pane Clicked',
  version: 1,
  description: 'User pressed to focus a document by click the focus pane button',
})

/**
 * When a focus document pane button is collapsed
 */
export const FocusDocumentPaneCollapsed = defineEvent({
  name: 'Focus Document Pane Collapsed',
  version: 1,
  description: 'User disabled the focus on a document pane by clicking the focus pane button',
})

export const FocusDocumentPaneNavigated = defineEvent({
  name: 'Focus Document Pane Navigated Via Breadcrumbs',
  version: 1,
  description:
    'User navigated to a different document pane via the breadcrumbs in the document header',
})
