/**
 * The locale namespace for the studio core.
 *
 * @internal
 * @hidden
 */
export const studioLocaleNamespace = 'studio' as const

/**
 * The locale namespace for the structure tool and the pane primitives
 * (document pane, pane chrome) that historically lived in `sanity/structure`.
 *
 * @public
 */
export const structureLocaleNamespace = 'structure' as const

/**
 * The namespace for validation messages.
 *
 * @internal
 * @hidden
 */
export const validationLocaleNamespace = 'validation' as const

/**
 * The namespace for copy/paste messages.
 *
 * @internal
 * @hidden
 */
export const copyPasteLocalNamespace = 'copy-paste' as const

/**
 * The namespace for feedback UI strings.
 *
 * @internal
 * @hidden
 */
export const feedbackLocaleNamespace = 'feedback' as const
