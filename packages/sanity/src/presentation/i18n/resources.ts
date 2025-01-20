export default {
  /** The title shown above the document list */
  'document-list-pane.document-list.title': 'Documents on this page',
  /** The text shown if the document list is unable to render */
  'document-list-pane.error.text': 'Could not render the document list',
  /** The status of the channel connection */
  'channel.status_connected': 'Connected',
  /** The status of the channel connection */
  'channel.status_connecting': 'Connecting',
  /** The status of the channel connection */
  'channel.status_disconnected': 'Disconnected',
  /** The status of the channel connection */
  'channel.status_reconnecting': 'Reconnecting',
  /** The text shown if the document editor is unable to render */
  'document-pane.error.text': 'Could not render the document editor',
  /** The text shown on the button for bypassing after a connection has failed */
  'error-card.continue-button.text': 'Continue anyway',
  /** The text shown on the button for retrying after a connection has failed */
  'error-card.retry-button.text': 'Retry',
  /** The title on the card shown after a connection has failed */
  'error-card.title': 'An error occurred',
  /** The text shown when the document is used in a single location */
  'locations-banner.locations-count_one': 'Used on one page',
  /** The text shown when the document is used in multiple locations */
  'locations-banner.locations-count_other': 'Used on {{count}} pages',
  /** The text shown when a resolver exists but the document is not used in any locations */
  'locations-banner.locations-count_zero': 'Not used on any pages',
  /** The text shown whilst the locations resolver is executing */
  'locations-banner.resolving.text': 'Resolving locations...',
  /** The label shown on a main document in the list pane */
  'main-document.label': 'Main document',
  /** The warning message text shown when a defined resolver fails to return a main document */
  'main-document.missing.text': 'Missing a main document for <Code>{{path}}</Code>',
  /** The label for a generic error message */
  'presentation-error.label': 'Error message',
  /** The text shown when the preview frame cannot connect to Presentation */
  'preview-frame.connection.error.text': 'Could not connect to the preview',
  /** The text shown on the button for dismissing the error overlay after a timeout */
  'preview-frame.continue-button.text': 'Continue anyway',
  /** The label for the loader's connection status */
  'preview-frame.loader.connection-status.label': 'Loader connection status',
  /** The `aria-label` for the navigator toggle button */
  'preview-frame.navigator.toggle-button.aria-label': 'Toggle navigator',
  /** The tooltip text for the navigator toggle button */
  'preview-frame.navigator.toggle-button.tooltip': 'Toggle navigator',
  /** The label for the overlay's connection status */
  'preview-frame.overlay.connection-status.label': 'Overlay connection status',
  /** The text shown on the overlay toggle button */
  'preview-frame.overlay.toggle-button.text': 'Edit',
  /** The text shown on the overlay toggle tooltip when overlays are enabled */
  'preview-frame.overlay.toggle-button.tooltip_disable': 'Disable edit overlay',
  /** The text shown on the overlay toggle tooltip when overlays are disabled */
  'preview-frame.overlay.toggle-button.tooltip_enable': 'Enable edit overlay',
  /** The text description for the published perspective switcher menu item */
  'preview-frame.perspective.published.text': 'View this page with published content',
  /** The `aria-label` for the refresh button */
  'preview-frame.refresh-button.aria-label': 'Refresh preview',
  /** The tooltip text for the refresh button */
  'preview-frame.refresh-button.tooltip': 'Refresh preview',
  /** Text describing the current status of the preview frame */
  'preview-frame.status_connecting': 'Connecting.',
  /** Text describing the current status of the preview frame */
  'preview-frame.status_loading': 'Loading.',
  /** Text describing the current status of the preview frame */
  'preview-frame.status_refreshing': 'Refreshing.',
  /** Text describing the current status of the preview frame */
  'preview-frame.status_reloading': 'Refreshing.',
  /** Text describing the current status of the preview frame */
  'preview-frame.status_timeout':
    'Unable to connect, check the browser console for more information.',
  /** The `aria-label` for the button that switches viewport size */
  'preview-frame.viewport-button.aria-label': 'Toggle viewport size',
  /** The viewport size button tooltip text when switching to a full width viewport */
  'preview-frame.viewport-button.tooltip_full': 'Switch to full viewport',
  /** The viewport size button tooltip text when switching to a narrow viewport */
  'preview-frame.viewport-button.tooltip_narrow': 'Switch to narrow viewport',
  /** The validation error message shown when the preview location input is missing an origin */
  'preview-location-input.error_missing-origin': 'URL must start with {{origin}}',
  /** The validation error message shown when the preview location input's base path matches that of the studio */
  'preview-location-input.error_same-base-path':
    'URL can’t have the same base path as the Studio {{basePath}}',
  /** The status of the clipboard operation when copying a URL */
  'share-url.clipboard.status_copying': 'Copying URL to clipboard…',
  /** The status of the clipboard operation when copying a URL */
  'share-url.clipboard.status_failed': 'Copy failed',
  /** The status of the clipboard operation when copying a URL */
  'share-url.clipboard.status_success': 'The URL is copied to the clipboard',
  /** The status of the clipboard operation when copying a URL */
  'share-url.clipboard.status_unsupported': 'Clipboard not supported',
  /** The share URL menu item text for opening a preview window */
  'share-url.menu-item.open.text': 'Open preview',
  /** Error toast that notifies that URL Preview Secrets can't be generated as the user lacks ACL grants */
  'preview-url-secret.missing-grants':
    "You don't have permission to create URL Preview Secrets. This will likely cause the preview to fail loading.",
  /** The `aria-label` for the button that opens the share menu */
  'preview-frame.share-button.aria-label': 'Share this preview',
  /** The <title> for the QR Code SVG that shows a link to the current preview */
  'share-preview-menu.qr-code.title': 'A QR Code which encodes the URL: {{url}}',
  /** Error message toast that shows the current user does not have permission to toggle sharing of the current preview */
  'share-preview-menu.error_toggle-sharing':
    "You don't have permission to toggle sharing of this preview",
  /** The text shown on the sharing toggle tooltip when sharing is enabled */
  'share-preview-menu.toggle-button.tooltip_disable': 'Disable sharing',
  /** The text shown on the sharing toggle tooltip when sharing is disabled */
  'share-preview-menu.toggle-button.tooltip_enable': 'Enable sharing',
  /** The first line of the label that renders next to the sharing toggle, it renders on two rows */
  'share-preview-menu.toggle-button.label_first-line': 'Share this preview',
  /** The second line of the label that renders next to the sharing toggle, it renders on two rows */
  'share-preview-menu.toggle-button.label_second-line': 'with anyone who has the link',
  /** Placeholder message for the QR Code SVG when sharing is yet to be enabled */
  'share-preview-menu.qr-code.placeholder': 'QR code will appear here',
  /** The text show below the QR Code SVG, with instructions on how to use it */
  'share-preview-menu.qr-code.instructions': 'Scan the QR Code to open the preview on your phone.',
  /** Menu item in the share preview menu that allows copying the current preview URL, if sharing is enabled */
  'share-preview-menu.copy-url.text': 'Copy preview link',
  /** Fallback message shown when the current user is not permitted to share previews */
  'share-preview-menu.error_missing-grants': "You don't have permission to share previews. ",
}
