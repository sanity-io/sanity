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
  /** Label for the Variants overview create-set action. */
  'overview.action.create-variant-set': 'Create variant set',
  /** Label for the Variants overview row edit action. */
  'overview.action.edit-variant': 'Edit variant definition',
  /** Label for the Variants overview row edit-set action (shown on set members). */
  'overview.action.edit-variant-set': 'Edit variant set',
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
  /** Lineage label shown when a variant definition is a member of a generated set. */
  'detail.lineage.part-of-set': 'Part of set: {{name}}',
  /** Lineage label shown when a variant definition was forked from a generated set. */
  'detail.lineage.forked-from-set': 'Forked from set: {{name}}',
  /** Badge on the overview row for a variant definition that belongs to a generated set. */
  'overview.badge.set': 'Set',
  /** Badge on the overview row for a variant definition forked from a generated set. */
  'overview.badge.forked': 'Forked',
  /** Empty state for variant document table. */
  'detail.documents.no-documents': 'No documents in this variant definition',
  /** Edited column header for variant document table. */
  'detail.documents.table.edited': 'Edited',
  /** Search placeholder for variant document table. */
  'detail.documents.table.search-placeholder': 'Search documents',
  /** Type column header for variant document table. */
  'detail.documents.table.type': 'Type',
  /** Bundle column header for variant document table. */
  'detail.documents.table.bundle': 'Bundle',
  /** Validation error tooltip for a single error in the variant document table. */
  'detail.documents.table.validation.error_one': '{{count}} validation error',
  /** Validation error tooltip for multiple errors in the variant document table. */
  'detail.documents.table.validation.error_other': '{{count}} validation errors',
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
  /** Title for the create variant set dialog. */
  'dialog.create-set.title': 'Create variant set',
  /** Label for the set name field in the create variant set dialog. */
  'dialog.create-set.name.label': 'Set name',
  /** Placeholder for the set name field in the create variant set dialog. */
  'dialog.create-set.name.placeholder': 'e.g. Regional launch',
  /** Validation message when the set name is missing. */
  'dialog.create-set.name.required': 'Set name is required',
  /** Title for the dimensions section in the create variant set dialog. */
  'dialog.create-set.dimensions.title': 'Dimensions',
  /** Description for the dimensions section in the create variant set dialog. */
  'dialog.create-set.dimensions.description':
    'Add each key and the list of values it can take. Every combination becomes a variant definition.',
  /** Label for the dimension key field in the create variant set dialog. */
  'dialog.create-set.dimension-key.label': 'Key',
  /** Label for the dimension values field in the create variant set dialog. */
  'dialog.create-set.dimension-values.label': 'Values',
  /**
   * Rotating example placeholders, one pair per dimension row, cycled by row index in
   * VariantSetForm so the form doesn't imply "market" is the only kind of dimension.
   */
  'dialog.create-set.example.0.key': 'e.g. market',
  'dialog.create-set.example.0.values': 'e.g. uk, us, de',
  'dialog.create-set.example.1.key': 'e.g. segment',
  'dialog.create-set.example.1.values': 'e.g. loyal, new, vip',
  'dialog.create-set.example.2.key': 'e.g. brand',
  'dialog.create-set.example.2.values': 'e.g. brand-a, brand-b',
  'dialog.create-set.example.3.key': 'e.g. channel',
  'dialog.create-set.example.3.values': 'e.g. web, app, email',
  /** Validation message when a dimension has a key but no values. */
  'dialog.create-set.dimension-values.required': 'Add at least one value',
  /** Add dimension action for the create variant set dialog. */
  'dialog.create-set.action.add-dimension': 'Add dimension',
  /** Tooltip when add dimension is disabled because the current row is incomplete. */
  'dialog.create-set.action.add-dimension.disabled-hint':
    'Complete the current key and values before adding another.',
  /** Remove dimension action for the create variant set dialog. */
  'dialog.create-set.remove-dimension': 'Remove dimension',
  /** Import-from-JSON action in the create variant set dialog. */
  'dialog.create-set.action.import-json': 'Import JSON',
  /** Export-to-JSON action in the create variant set dialog. */
  'dialog.create-set.action.export-json': 'Export JSON',
  /** Import-from-CDP action (not yet available) in the create variant set dialog. */
  'dialog.create-set.action.import-cdp': 'Import from CDP',
  /** Sync-from-CDP action (not yet available) in the create variant set dialog. */
  'dialog.create-set.action.sync-cdp': 'Sync from CDP',
  /** Tooltip on the not-yet-available CDP actions. */
  'dialog.create-set.cdp.coming-soon': 'Coming soon',
  /** Error toast when an imported file cannot be read as a variant set. */
  'dialog.create-set.import.error': 'Could not read that file as a variant set',
  /** Cancel action for the create variant set dialog. */
  'dialog.create-set.action.cancel': 'Cancel',
  /** Preview shown before any complete dimension exists in the create variant set dialog. */
  'dialog.create-set.preview.empty': 'Add at least one key and value to preview the combinations',
  /** Preview of the number of variant definitions a set will generate (singular). */
  'dialog.create-set.preview.count_one': '{{count}} variant definition will be generated',
  /** Preview of the number of variant definitions a set will generate (plural). */
  'dialog.create-set.preview.count_other': '{{count}} variant definitions will be generated',
  /** Confirm action for the create variant set dialog (singular). */
  'dialog.create-set.action.generate_one': 'Generate {{count}} variant definition',
  /** Confirm action for the create variant set dialog (plural). */
  'dialog.create-set.action.generate_other': 'Generate {{count}} variant definitions',
  /** Warning shown before generating an unusually large set. */
  'dialog.create-set.large-set.warning':
    'This creates {{count}} variant definitions, which is a lot at once. Double-check your dimensions before generating.',
  /** Confirm action after the large-set warning has been shown. */
  'dialog.create-set.action.generate-confirm': 'Generate anyway',
  /** Error toast title when generating a variant set fails. */
  'dialog.create-set.error.title': 'Unable to generate variant definitions',
  /** Result heading after a variant set is generated (singular). */
  'dialog.create-set.result.title_one': '{{count}} variant definition generated',
  /** Result heading after a variant set is generated (plural). */
  'dialog.create-set.result.title_other': '{{count}} variant definitions generated',
  /** Result description after a variant set is generated. */
  'dialog.create-set.result.description':
    'These are now listed under variant definitions. Editing one on its own will save it as a separate definition.',
  /** Done action to close the create variant set dialog after generation. */
  'dialog.create-set.action.done': 'Done',
  /** Title for the edit variant set dialog. */
  'dialog.edit-set.title': 'Edit variant set',
  /** Description for the edit variant set dialog. */
  'dialog.edit-set.description':
    'Rename a value to update every definition that uses it. Removing a value deletes its definitions, unless they still contain documents.',
  /** Add value action in the edit variant set dialog. */
  'dialog.edit-set.add-value': 'Add value',
  /** Remove value action in the edit variant set dialog. */
  'dialog.edit-set.remove-value': 'Remove value',
  /** Preview shown when a set edit has no pending changes. */
  'dialog.edit-set.preview.none': 'No changes yet',
  /** Preview: number of definitions a set edit will update (singular). */
  'dialog.edit-set.preview.update_one': '{{count}} definition will be updated',
  /** Preview: number of definitions a set edit will update (plural). */
  'dialog.edit-set.preview.update_other': '{{count}} definitions will be updated',
  /** Preview: number of definitions a set edit will create (singular). */
  'dialog.edit-set.preview.create_one': '{{count}} definition will be created',
  /** Preview: number of definitions a set edit will create (plural). */
  'dialog.edit-set.preview.create_other': '{{count}} definitions will be created',
  /** Preview: number of definitions a set edit will delete (singular). */
  'dialog.edit-set.preview.delete_one': '{{count}} definition will be deleted',
  /** Preview: number of definitions a set edit will delete (plural). */
  'dialog.edit-set.preview.delete_other': '{{count}} definitions will be deleted',
  /** Warning when a value removal is blocked because definitions still have documents. */
  'dialog.edit-set.warning.blocked':
    'Cannot remove values that still have documents: {{values}}. Move or remove those documents first.',
  /** Warning when renames were skipped because the target value already exists. */
  'dialog.edit-set.warning.conflict':
    'Renames skipped because the value already exists: {{values}}',
  /** Apply action in the edit variant set dialog. */
  'dialog.edit-set.action.apply': 'Apply changes',
  /** Cancel action in the edit variant set dialog. */
  'dialog.edit-set.action.cancel': 'Cancel',
  /** Error toast title when applying a set edit fails. */
  'dialog.edit-set.error.title': 'Unable to update the variant set',
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
