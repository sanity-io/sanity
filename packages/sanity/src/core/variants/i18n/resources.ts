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
  /** Label for the Variants overview create action. */
  'overview.action.create-variant': 'Create variant',
  /** Label for the Variants overview delete action. */
  'overview.action.delete-variant': 'Delete variant',
  /** Link label for Variants overview documentation (empty state). */
  'overview.action.documentation': 'Documentation',
  /** Description for the Variants overview empty state. */
  'overview.empty-state.description':
    'Variant definitions describe how content is personalized for audiences, locales, segments, and more.',
  /** Description for the Variants overview. */
  'overview.description':
    'Manage variant definitions that control how content is personalized for different audiences, locales, and segments.',
  /** Error message for the Variants overview. */
  'overview.error': 'Unable to load variants',
  /** Placeholder for the Variants overview search field. */
  'overview.search.placeholder': 'Search variant definitions…',
  /** Column header for the variant title column in the overview table. */
  'overview.table.variant': 'Variant',
  /** Column header for document count in the overview table. */
  'overview.table.documents': 'Documents',
  /** Fallback text when a variant has no conditions. */
  'overview.table.no-conditions': 'No conditions',
  /** Title for the Variants overview. */
  'overview.title': 'Variants',
  /** Back action on the Variant detail page. */
  'detail.back': 'Back to variants',
  /** Loading message on the Variant detail page. */
  'detail.loading': 'Loading variant',
  /** Fallback text when a variant has no description. */
  'detail.no-description': 'No description yet.',
  /** Description for the missing Variant detail page. */
  'detail.not-found.description': 'The requested variant could not be found.',
  /** Title for the missing Variant detail page. */
  'detail.not-found.title': 'Variant not found',
  /** Placeholder text on the Variant detail page. */
  'detail.placeholder': 'Variant detail editing will be added in a future iteration.',
  /** Title for the create variant dialog. */
  'dialog.create.title': 'Create variant',
  /** Confirm action for the create variant dialog. */
  'dialog.create.action.confirm': 'Create variant',
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
  'dialog.create.description.placeholder': 'Describe who this variant targets',
  /** Title for the conditions section in the create variant dialog. */
  'dialog.create.conditions.title': 'Conditions',
  /** Description for the conditions section in the create variant dialog. */
  'dialog.create.conditions.description':
    'Add key/value pairs that define when this variant applies.',
  /** Label for the condition key field in the create variant dialog. */
  'dialog.create.condition-key.label': 'Key',
  /** Validation message when a condition key is repeated. */
  'dialog.create.condition-key.duplicate': 'Condition keys must be unique',
  /** Placeholder for the condition key field in the create variant dialog. */
  'dialog.create.condition-key.placeholder': 'e.g. audience',
  /** Label for the condition value field in the create variant dialog. */
  'dialog.create.condition-value.label': 'Value',
  /** Placeholder for the condition value field in the create variant dialog. */
  'dialog.create.condition-value.placeholder': 'e.g. loyal-customers',
  /** Error toast title when variant creation fails. */
  'dialog.create.error.title': 'Unable to create variant',
}

/**
 * @alpha
 */
export type VariantsLocaleResourceKeys = keyof typeof variantsLocaleStrings

export default variantsLocaleStrings
