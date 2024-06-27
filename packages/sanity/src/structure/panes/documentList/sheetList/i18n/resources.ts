/**
 * Defined locale strings for the sheet list, in US English.
 *
 * @internal
 */
const sheetListLocaleStrings = {
  /** Button label for the publish all selected action in sheet list */
  'actions.publish-all-label': 'Publish all',
  /** Label listing count of all selected items in sheet list */
  'actions.selected-count-label': '{{count}} {{itemPlural}} selected',
  /** Toast description when error occurs whilst publishing selected items */
  'actions.toast.publishing-failed-description': 'An error occurred whilst publishing items',
  /** Toast description whilst pending publish of selected items */
  'actions.toast.publishing-pending-description': 'Publishing {{itemPlural}}…',
  /** Toast title whilst pending publish of selected items */
  'actions.toast.publishing-pending-title': 'Publishing…',
  /** Toast description when publishing of selected items has succeeded */
  'actions.toast.publishing-success-description': 'The item have been published',
  /** Toast title when publishing of selected items has succeeded */
  'actions.toast.publishing-success-title': 'Published',
  /** Button label for the unselect all selected action in sheet list */
  'actions.unselect-all-label': 'Unselect all',
  /** Label for the edit columns button to change field visibility in sheet list */
  'edit-columns': 'Edit columns',
  /** Label for the header menu option to hide a field from the sheet list */
  'hide-field': 'Remove from table',
  /** Tooltip for button to navigate to first sheet list page */
  'pagination.first-page.tooltip': 'Go to first page',
  /** Tooltip for button to navigate to last sheet list page */
  'pagination.last-page.tooltip': 'Go to last page',
  /** Tooltip for button to navigate to next sheet list page */
  'pagination.next-page.tooltip': 'Go to next page',
  /** Label listing the current page in relation to the total number of sheet list pages */
  'pagination.page-count-label': '{{currentPage}} of {{pageCount}}',
  /** Tooltip for button to navigate to previous sheet list page */
  'pagination.previous-page.tooltip': 'Go to previous page',
  /** Header title for list preview column */
  'preview-header': 'List preview',
  /** Label for reset column visibilities button */
  'reset-columns': 'Reset columns',
  /** Label listing the total number of visible rows in sheet list */
  'row-count.label': 'List total: {{totalRows}} {{itemPlural}}',
  /** Placeholder for search input on sheet list  */
  'search.placeholder': 'Search list',
  /** Title for the edit columns menu */
  'select-fields': 'Select up to 5 field types',
  /** The message that will be shown to users when the table view is not supported the list has no schema type */
  'not-supported.no-schema-type':
    'Table view is only supported using the <code>S.documentTypeListItems</code> builder',
  /** Text for listing the reason items cannot be published in sheet list */
  'validation-error.reason': 'Item with ID {{id}} cannot be published:',
  /** Button tooltip for publish all action button in sheet list when selections have validation errors */
  'validation-error.tooltip': 'Cannot publish documents with validation errors',
}

/**
 * @alpha
 */
export type SheetListLocaleResourceKeys = keyof typeof sheetListLocaleStrings

export default sheetListLocaleStrings
