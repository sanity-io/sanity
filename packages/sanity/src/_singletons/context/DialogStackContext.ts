import {createContext} from 'sanity/_createContext'

/**
 * Context value for tracking the dialog stack.
 *
 * @beta
 */
export interface DialogStackContextValue {
  /** Stack of dialog IDs, last one is the top */
  stack: string[]
  /** Push a dialog onto the stack */
  push: (id: string) => void
  /** Remove a dialog from the stack */
  remove: (id: string) => void
  /** Close all dialogs by clearing the stack */
  closeAll: () => void
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
