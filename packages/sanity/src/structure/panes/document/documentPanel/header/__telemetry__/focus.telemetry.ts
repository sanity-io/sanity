import {defineEvent} from '@sanity/telemetry'

/**
 * When a document pane is maximized via the focus pane button
 */
export const DocumentPaneMaximized = defineEvent({
  name: 'Document Pane Maximized',
  version: 1,
  description: 'User maximized a document pane via the focus pane button',
})

/**
 * When a maximized document pane is collapsed via the focus pane button
 */
export const DocumentPaneCollapsed = defineEvent({
  name: 'Document Pane Collapsed',
  version: 1,
  description: 'User collapsed a maximized document pane via the focus pane button',
})

interface DocumentPaneNavigatedInfo {
  /** How the user navigated to the document pane */
  path: 'breadcrumb'
}

/**
 * When the user navigates to a different document pane
 */
export const DocumentPaneNavigated = defineEvent<DocumentPaneNavigatedInfo>({
  name: 'Document Pane Navigated',
  version: 1,
  description: 'User navigated to a different document pane via the breadcrumbs in the header',
})
