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
  /** Close all dial  ogs by clearing the stack */
  close: () => void
  /** Navigate up in the stack */
  navigateUp: () => void
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
