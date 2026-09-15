import {type ThemeColorSchemeKey} from '@sanity/ui/theme'

/**
 * ui5 tokens use `light-dark()` and declare `:root { color-scheme: light dark }`.
 * That combination follows the OS until a more specific `color-scheme: light|dark`
 * is set on the document. `@sanity/ui` v4 `ThemeProvider` is context-only and
 * does not write that property, so comments and other ui5 surfaces pick OS
 * colors when Studio appearance ≠ `prefers-color-scheme`.
 *
 * @internal
 */
export function applyDocumentColorScheme(scheme: ThemeColorSchemeKey): () => void {
  const root = document.documentElement
  const previous = root.style.colorScheme
  root.style.colorScheme = scheme
  return () => {
    root.style.colorScheme = previous
  }
}

const COLOR_SCHEME_STORAGE_KEY = 'sanityStudio:ui:colorScheme'

/**
 * Apply a stored explicit Studio scheme before React mounts so the first paint
 * of ui5 `light-dark()` tokens matches Appearance. `"system"` is left unset so
 * `:root { color-scheme: light dark }` keeps following the OS.
 *
 * @internal
 */
export function applyStoredDocumentColorScheme(): void {
  if (typeof document === 'undefined') {
    return
  }

  try {
    const stored = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.style.colorScheme = stored
    }
  } catch {
    // localStorage can throw in private browsing / disabled storage
  }
}
