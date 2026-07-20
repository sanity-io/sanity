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
  /** Tooltip for pinning a variant to the studio. */
  'detail.pin-variant': 'Pin variant definition to studio',
  /** Tooltip for unpinning a variant from the studio. */
  'detail.unpin-variant': 'Unpin variant definition from studio',
  /** Back action on the Variant detail page. */
  'detail.back': 'Back to variant definitions',
  /** Created status label in the Variant detail footer. */
  'detail.footer.created': 'Created',
  /** Loading message on the Variant detail page. */
  'detail.loading': 'Loading variant definition',
  /** Fallback text when a variant has no description. */
  'detail.no-description': 'No description yet.',
  /** Empty state for variant document table. */
  'detail.documents.no-documents': 'No documents in this variant definition',
  /** Edited column header for variant document table. */
  'detail.documents.table.edited': 'Edited',
  /** Search placeholder for variant document table. */
  'detail.documents.table.search-placeholder': 'Search documents',
  /** Type column header for variant document table. */
  'detail.documents.table.type': 'Type',
  /** "Appears in" column header for variant document table (which bundles each doc is in). */
  'detail.documents.table.appears-in': 'Appears in',
  /** Header of the popover listing the bundles a document appears in beyond the first chip. */
  'detail.documents.appears-in.also-in': 'Also in',
  /** Label for the release lane above the variant document table. */
  'detail.release-lane.title': 'Releases',
  /** The "show all documents" segment of the release lane. */
  'detail.release-lane.all': 'All',
  /** A single release lane filter tab: a bundle label followed by its document count. */
  'detail.release-lane.count': '{{label}} ({{count}})',
  /** Toggle that switches the documents table into the grouped-by-release (swimlane) view. */
  'detail.release-lane.group-by-release': 'Group by release',
  /** Document count on a release swimlane group header (singular). */
  'detail.release-lane.group-count_one': '{{count}} document',
  /** Document count on a release swimlane group header (plural). */
  'detail.release-lane.group-count_other': '{{count}} documents',
  /** Validation error tooltip for a single error in the variant document table. */
  'detail.documents.table.validation.error_one': '{{count}} validation error',
  /** Validation error tooltip for multiple errors in the variant document table. */
  'detail.documents.table.validation.error_other': '{{count}} validation errors',
  /** Accessible label for the select-all checkbox in the variant document table header. */
  'detail.documents.bulk.select-all': 'Select all documents',
  /** Accessible label for a per-row select checkbox in the variant document table. */
  'detail.documents.bulk.select-row': 'Select document',
  /** Count of selected documents in the bulk-action bar (singular). */
  'detail.documents.bulk.selected_one': '{{count}} selected',
  /** Count of selected documents in the bulk-action bar (plural). */
  'detail.documents.bulk.selected_other': '{{count}} selected',
  /** Label for the bulk-actions menu button. */
  'detail.documents.bulk.actions': 'Actions',
  /** Bulk action: publish the selected documents. */
  'detail.documents.bulk.publish': 'Publish selected',
  /** Bulk action: delete the selected documents. */
  'detail.documents.bulk.delete': 'Delete selected',
  /** Label for clearing the current document selection. */
  'detail.documents.bulk.clear': 'Clear',
  /** Note that bulk actions are prototyped but not yet wired to real operations. */
  'detail.documents.bulk.stub-note': 'Bulk actions are being wired up',
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
