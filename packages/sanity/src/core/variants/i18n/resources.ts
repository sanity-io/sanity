/**
 * Defined locale strings for variants, in US English.
 *
 * @internal
 */
const variantsLocaleStrings = {
  /** Label for the variants navigation row. */
  'navbar.view-as': 'View as',
  /** Label for the version selector in the variants navigation row. */
  'navbar.version': 'Version',
  /** Label for the variant selector in the variants navigation row. */
  'navbar.variant': 'Variant',
  /** Default option label when no variant is selected. */
  'navbar.variant.default': 'All users (Default)',
  /** Placeholder for the variant filter input in the dropdown. */
  'navbar.variant.filter-placeholder': 'Filter variants…',
  /** Section header for non-default variants in the dropdown. */
  'navbar.variant.other': 'Other variants',
  /** Label for clearing version and variant selections. */
  'navbar.clear': 'Clear',
  /** Tooltip for clearing the selected variant. */
  'navbar.variant.clear': 'Clear variant selection',
  /** Label for the Variants overview create action. */
  'overview.action.create-variant': 'Create variant definition',
  /** Label for the Variants overview primary create action (mirrors "New release"). */
  'overview.action.new-variant': 'New variant definition',
  /** Label for the Variants overview row edit action. */
  'overview.action.edit-variant': 'Edit variant definition',
  /** Label for the Variants overview delete action. */
  'overview.action.delete-variant': 'Delete variant definition',
  /** Tooltip when delete is disabled because the variant contains one document. */
  'overview.action.delete-variant.disabled-hint_one':
    "This variant definition contains {{count}} document in it, it can't be removed until the documents have been removed.",
  /** Tooltip when delete is disabled because the variant contains multiple documents. */
  'overview.action.delete-variant.disabled-hint_other':
    "This variant definition contains {{count}} documents in it, it can't be removed until the documents have been removed.",
  /** Error toast title when variant deletion fails. */
  'overview.action.delete-variant.error.title': 'Unable to delete variant definition',
  /** Link label for Variants overview documentation (empty state). */
  'overview.action.documentation': 'Documentation',
  /** Description for the Variants overview empty state. */
  'overview.empty-state.description':
    'Variant definitions describe how content is personalized for audiences, locales, segments, and more.',
  /** Description for the Variants overview. */
  'overview.description':
    'Manage variant definitions that control how content is personalized for different audiences, locales, and segments.',
  /** Error message for the Variants overview. */
  'overview.error': 'Unable to load variant definitions',
  /** Placeholder for the Variants overview search field. */
  'overview.search.placeholder': 'Search variant definitions…',
  /** Accessible label for the overview select-all checkbox. */
  'overview.bulk.select-all': 'Select all variant definitions',
  /** Accessible label for a per-row selection checkbox in the overview. */
  'overview.bulk.select-row': 'Select variant definition',
  /** Count of selected variant definitions in the bulk-action bar (singular). */
  'overview.bulk.selected_one': '{{count}} selected',
  /** Count of selected variant definitions in the bulk-action bar (plural). */
  'overview.bulk.selected_other': '{{count}} selected',
  /** Clears the current overview selection. */
  'overview.bulk.clear': 'Clear selection',
  /** Bulk toolbar action that deletes the selected variant definitions. */
  'overview.bulk.delete': 'Delete',
  /** Header for the bulk delete confirmation dialog. */
  'overview.bulk.delete-dialog.header': 'Delete variant definitions',
  /** Confirm button for the bulk delete dialog. */
  'overview.bulk.delete-dialog.confirm': 'Delete',
  /** Bulk delete dialog body when definitions will be deleted (singular). */
  'overview.bulk.delete-dialog.description_one':
    'You are about to delete {{count}} variant definition. This cannot be undone.',
  /** Bulk delete dialog body when definitions will be deleted (plural). */
  'overview.bulk.delete-dialog.description_other':
    'You are about to delete {{count}} variant definitions. This cannot be undone.',
  /** Note about selected definitions kept because they contain documents (singular). */
  'overview.bulk.delete-dialog.kept_one':
    '{{count}} selected definition contains documents and will be kept.',
  /** Note about selected definitions kept because they contain documents (plural). */
  'overview.bulk.delete-dialog.kept_other':
    '{{count}} selected definitions contain documents and will be kept.',
  /** Bulk delete dialog body when nothing can be deleted (all selected hold documents). */
  'overview.bulk.delete-dialog.none':
    'All selected definitions contain documents, so none can be deleted. Remove their documents first.',
  /** Toast shown after a successful bulk delete (singular). */
  'overview.bulk.delete-toast.success_one': 'Deleted {{count}} variant definition',
  /** Toast shown after a successful bulk delete (plural). */
  'overview.bulk.delete-toast.success_other': 'Deleted {{count}} variant definitions',
  /** Toast shown when some variant definitions could not be bulk deleted. */
  'overview.bulk.delete-toast.error': 'Some variant definitions could not be deleted',
  /** Clears the selected values for a single condition filter dropdown. */
  'overview.filter.clear': 'Clear',
  /** Clears every active condition filter across all dimensions. */
  'overview.filter.clear-all': 'Clear filters',
  /** Accessible label / tooltip for removing a single active filter value chip. */
  'overview.filter.remove-value': 'Remove filter',
  /** The button that opens the add-filter menu. */
  'overview.filter.add': 'Add filter',
  /** Placeholder for the searchable dimension list in the add-filter menu. */
  'overview.filter.find-dimension': 'Find a dimension…',
  /** Back action returning from a dimension's values to the dimension list. */
  'overview.filter.back': 'All dimensions',
  /** Shown in the add-filter menu when a search matches no dimension. */
  'overview.filter.no-dimensions': 'No dimensions',
  /** Hint in the add-filter menu's value pane before a dimension is chosen. */
  'overview.filter.pick-dimension-hint': 'Select a dimension to see its values',
  /** Column header for the variant title column in the overview table. */
  'overview.table.variant': 'Variant definition',
  /** Column header for the documents count column in the overview table. */
  'overview.table.documents': 'Documents',
  /** Fallback text when a variant has no conditions. */
  'overview.table.no-conditions': 'No conditions',
  /** Title for the Variants overview. */
  'overview.title': 'Variant definitions',
  /** Edit action on the Variant detail page. */
  'detail.action.edit-variant': 'Edit variant definition',
  /** Primary action label on the Variant detail action rail. */
  'detail.action.edit-definition': 'Edit definition',
  /** Accessible label / tooltip for the Variant detail overflow menu button. */
  'detail.menu.label': 'Actions',
  /** Tooltip for pinning a variant to the studio. */
  'detail.pin-variant': 'Pin variant definition to studio',
  /** Tooltip for unpinning a variant from the studio. */
  'detail.unpin-variant': 'Unpin variant definition from studio',
  /** Back action on the Variant detail page (the arrow already conveys "back to"). */
  'detail.back': 'All variant definitions',
  /** Title of the "variant definition" properties panel (its targeting conditions). */
  'detail.metadata.definition': 'Variant definition',
  /** Title of the "details" properties panel (document counts + when the variant was created). */
  'detail.metadata.details': 'Details',
  /** Label for the total document count row in the details properties panel. */
  'detail.metadata.total-documents': 'Total documents',
  /** Label for the count of documents with unpublished (draft) changes. */
  'detail.metadata.unpublished-changes': 'Unpublished changes',
  /** Label for the variant definition's resolution priority on the detail page. */
  'detail.metadata.priority': 'Priority',
  /** Created status label in the Variant detail footer. */
  'detail.footer.created': 'Created',
  /** Loading message on the Variant detail page. */
  'detail.loading': 'Loading variant definition',
  /** Fallback text when a variant has no description. */
  'detail.no-description': 'No description yet.',
  /** Empty state for variant document table. */
  'detail.documents.no-documents': 'No documents in this variant definition',
  /** "Last edited" (relative time) column header for variant document table. */
  'detail.documents.table.last-edited': 'Last edited',
  /** "Edited by" (last editor) column header for variant document table. */
  'detail.documents.table.edited-by': 'Edited by',
  /** Document (title/preview) column header for variant document table. */
  'detail.documents.table.document': 'Document',
  /** Search placeholder for the variant document table search input in the command lane. */
  'detail.documents.table.search-placeholder': 'Search documents',
  /** Type column header for variant document table. */
  'detail.documents.table.type': 'Type',
  /** "Appears in" column header for variant document table (which bundles each doc is in). */
  'detail.documents.table.appears-in': 'Appears in',
  /** Header of the popover listing the bundles a document appears in beyond the first chip. */
  'detail.documents.appears-in.also-in': 'Also in',
  /** The "show all documents" segment of the release lane. */
  'detail.release-lane.all': 'All',
  /** A single release lane filter tab: a bundle label followed by its document count. */
  'detail.release-lane.count': '{{label}} ({{count}})',
  /** Validation error tooltip for a single error in the variant document table. */
  'detail.documents.table.validation.error_one': '{{count}} validation error',
  /** Validation error tooltip for multiple errors in the variant document table. */
  'detail.documents.table.validation.error_other': '{{count}} validation errors',
  /** Validation status tooltip when a document has no validation errors (the "ready" state). */
  'detail.documents.table.validation.valid': 'No validation errors',
  /** Accessible label for the command-lane select-all checkbox. */
  'detail.documents.bulk.select-all': 'Select all documents',
  /** Accessible label for a per-row selection checkbox. */
  'detail.documents.bulk.select-row': 'Select document',
  /** Count of selected documents in the bulk-action bar (singular). */
  'detail.documents.bulk.selected_one': '{{count}} selected',
  /** Count of selected documents in the bulk-action bar (plural). */
  'detail.documents.bulk.selected_other': '{{count}} selected',
  /** Clears the current document selection (grouped with the selected count). */
  'detail.documents.bulk.clear': 'Clear selection',
  /** Primary bulk action: publish the selected documents. */
  'detail.documents.bulk.publish': 'Publish',
  /** Primary bulk action: delete the selected documents. */
  'detail.documents.bulk.delete': 'Delete',
  /** Overflow menu of secondary bulk actions. */
  'detail.documents.bulk.more': 'More bulk actions',
  /** Secondary bulk action: unpublish the selected documents. */
  'detail.documents.bulk.unpublish': 'Unpublish',
  /** Secondary bulk action: add the selected documents to a release. */
  'detail.documents.bulk.add-to-release': 'Add to release',
  /** Error message when variant documents fail to load. */
  'detail.documents.error': 'Unable to load documents for this variant definition',
  /** Description for the missing Variant detail page. */
  'detail.not-found.description': 'The requested variant definition could not be found.',
  /** Title for the missing Variant detail page. */
  'detail.not-found.title': 'Variant definition not found',
  /** Title for the create variant dialog. */
  'dialog.create.title': 'Create variant definition',
  /** Confirm action for the create variant dialog. */
  'dialog.create.action.confirm': 'Create variant definition',
  /** Add condition action for the create variant dialog. */
  'dialog.create.action.add-condition': 'Add condition',
  /** Tooltip when add condition is disabled because the current row is incomplete. */
  'dialog.create.action.add-condition.disabled-hint':
    'Complete the current condition key and value before adding another.',
  /** Remove condition action for the create variant dialog. */
  'dialog.create.remove-condition': 'Remove condition',
  /** Label for the variant title field in the create variant dialog. */
  'dialog.create.variant-title.label': 'Title',
  /** Placeholder for the variant title field in the create variant dialog. */
  'dialog.create.variant-title.placeholder': 'e.g. Loyal customers',
  /** Validation message when the variant title is missing. */
  'dialog.create.variant-title.required': 'Title is required',
  /** Label for the description field in the create variant dialog. */
  'dialog.create.description.label': 'Description',
  /** Placeholder for the description field in the create variant dialog. */
  'dialog.create.description.placeholder': 'Describe who this variant definition targets',
  /** Label for the priority field in the variant dialog. */
  'dialog.create.priority.label': 'Priority',
  /** Tooltip explaining how priority affects variant matching. */
  'dialog.create.priority.tooltip':
    'When multiple variant definitions match with the same specificity, the one with the higher priority wins.',
  /** Validation message when priority is not a valid number. */
  'dialog.create.priority.invalid': 'Priority must be a number',
  /** Title for the conditions section in the create variant dialog. */
  'dialog.create.conditions.title': 'Conditions',
  /** Description for the conditions section in the create variant dialog. */
  'dialog.create.conditions.description':
    'Add key/value pairs that define when this variant definition applies.',
  /** Label for the condition key field in the create variant dialog. */
  'dialog.create.condition-key.label': 'Key',
  /** Validation message when a condition key is repeated. */
  'dialog.create.condition-key.duplicate': 'Condition keys must be unique',
  /** Validation message when a condition key uses a reserved prefix. */
  'dialog.create.condition-key.reserved': 'Condition keys cannot start with _ or $',
  /** Validation message when a condition key has an invalid format. */
  'dialog.create.condition-key.invalid':
    'Condition keys must be lowercase, start with a letter, and use letters, numbers, underscores, or hyphens',
  /** Validation message when a condition key is missing. */
  'dialog.create.condition-key.required': 'Condition key is required',
  /** Validation message when a condition value is missing. */
  'dialog.create.condition-value.required': 'Condition value is required',
  /** Validation message when a condition value has an invalid format. */
  'dialog.create.condition-value.invalid': 'Condition values cannot contain colons',
  /** Placeholder for the condition key field in the create variant dialog. */
  'dialog.create.condition-key.placeholder': 'e.g. audience',
  /** Label for the condition value field in the create variant dialog. */
  'dialog.create.condition-value.label': 'Value',
  /** Placeholder for the condition value field in the create variant dialog. */
  'dialog.create.condition-value.placeholder': 'e.g. loyal-customers',
  /** Error toast title when variant creation fails. */
  'dialog.create.error.title': 'Unable to create variant definition',
  /** Title for the edit variant dialog. */
  'dialog.edit.title': 'Edit variant definition',
  /** Confirm action for the edit variant dialog. */
  'dialog.edit.action.confirm': 'Save',
  /** Cancel action for the edit variant dialog. */
  'dialog.edit.action.cancel': 'Cancel',
  /** Error toast title when variant editing fails. */
  'dialog.edit.error.title': 'Unable to update variant definition',
  /** Title for the delete variant confirmation dialog. */
  'dialog.delete.title': 'Are you sure you want to delete this variant definition?',
  /** Description for the delete variant confirmation dialog. */
  'dialog.delete.description':
    'This will permanently delete "{{title}}". This action cannot be undone.',
  /** Confirm action for the delete variant confirmation dialog. */
  'dialog.delete.action.confirm': 'Yes, delete variant definition',
}

/**
 * @alpha
 */
export type VariantsLocaleResourceKeys = keyof typeof variantsLocaleStrings

export default variantsLocaleStrings
