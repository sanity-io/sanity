/**
 * Re-export TanStack Virtual so call sites do not import `@tanstack/react-virtual` directly.
 *
 * `oxc-transform-react` still emits `IncompatibleLibrary` for `useVirtualizer()` when the import
 * specifier is `@tanstack/react-virtual`, even inside a `'use no memo'` function. Vite then prints
 * `[plugin vite:react-compiler]`. Importing from this module avoids that diagnostic.
 *
 * Callers that use `useVirtualizer` must still put `'use no memo'` first so the virtualizer result
 * is not compiled — compiling it can leave lists/scroll positions stale.
 *
 * @internal
 */
export {useVirtualizer} from '@tanstack/react-virtual'
