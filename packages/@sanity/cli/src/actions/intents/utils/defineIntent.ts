/* Note: this is a backup copy of defineIntent for when it's not available in \@sanity/sdk
   It's used to provide type safety and validation for intent objects.
*/

/**
 * Filter criteria for intent matching
 * All properties are optional, allowing for flexible intent registration
 * @internal - This is a backup copy of defineIntent for when it's not available in \@sanity/sdk
 */
export interface IntentFilter {
  /**
   * Project ID to match against
   * @remarks When specified, the intent will only match for the specified project
   */
  projectId?: string

  /**
   * Dataset to match against
   * @remarks When specified, the intent will only match for the specified dataset
   */
  dataset?: string

  /**
   * Document types that this intent can handle
   * @remarks When specified, the intent will only match for documents of these types.
   * Use ['*'] to match all document types.
   */
  types?: string[]
}

/**
 * Intent definition structure for registering user intents
 * @internal - This is a backup copy of defineIntent for when it's not available in \@sanity/sdk
 */
export interface Intent {
  /**
   * Unique identifier for this intent
   * @remarks Should be unique across all registered intents for proper matching
   */
  id: string

  /**
   * The action that this intent performs
   * @remarks Examples: "view", "edit", "create", "delete", "duplicate"
   */
  action: string

  /**
   * Human-readable title for this intent
   * @remarks Used for display purposes in UI or logs
   */
  title: string

  /**
   * Detailed description of what this intent does
   * @remarks Helps users understand the purpose and behavior of the intent
   */
  description: string

  /**
   * Array of filter criteria for intent matching
   * @remarks At least one filter is required. Use \{types: \['*']\} to match everything
   */
  filters: IntentFilter[]
}

/**
 * Backup implementation of defineIntent for when it's not available in \@sanity/sdk
 *
 * This utility function provides TypeScript support and validation for intent objects
 * that will be saved as Sanity documents. It ensures the intent structure matches
 * the expected format and provides helpful IntelliSense during development.
 *
 * @param intent - The intent definition object
 * @returns The same intent object with proper typing
 * @internal
 */
export function defineIntentBackup(intent: Intent): Intent {
  // Validate required fields
  if (!intent.id) {
    throw new Error('Intent must have an id')
  }
  if (!intent.action) {
    throw new Error('Intent must have an action')
  }
  if (!intent.title) {
    throw new Error('Intent must have a title')
  }
  if (!intent.description) {
    throw new Error('Intent must have a description')
  }
  if (!Array.isArray(intent.filters)) {
    throw new Error('Intent must have a filters array')
  }
  if (intent.filters.length === 0) {
    throw new Error(
      "Intent must have at least one filter. If you want to match everything, use {types: ['*']}",
    )
  }

  // Return the intent as-is, providing type safety and runtime validation
  return intent
}
