import type {Path} from '@sanity/types'
import {createContext} from 'sanity/_createContext'

/**
 * Entry in the dialog stack.
 *
 * @beta
 */
export interface DialogStackEntry {
  id: string
  path?: Path
}

/**
 * Context value for tracking the dialog stack.
 *
 * @beta
 */
export interface DialogStackContextValue {
  /** Stack of dialog entries, last one is the top */
  stack: DialogStackEntry[]
  /** Push a dialog onto the stack */
  push: (id: string, path?: Path) => void
  /** Remove a dialog from the stack */
  remove: (id: string) => void
  /** Update the path of an existing dialog entry */
  update: (id: string, path?: Path) => void
  /** Close dialogs. Pass `{ toParent: true }` to close only the top dialog and navigate to the parent. */
  close: (options?: {
    /**
     * When true, closes only the top dialog and navigates to its parent path.
     * When false or omitted, closes all dialogs and resets to the root path.
     */
    toParent?: boolean
  }) => void
  /** Navigate to a specific path, updating the form path and cleaning up stack entries that are at or deeper than the target. */
  navigateTo: (path: Path) => void
}

/**
 * Context for tracking the stack of open dialogs.
 *
 * @beta
 */
export const DialogStackContext = createContext<DialogStackContextValue | null>(
  'sanity/_singletons/context/dialog-stack',
  null,
)
