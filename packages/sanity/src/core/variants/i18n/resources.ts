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
}

/**
 * @alpha
 */
export type VariantsLocaleResourceKeys = keyof typeof variantsLocaleStrings

export default variantsLocaleStrings
