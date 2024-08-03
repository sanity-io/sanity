import {createContext} from 'sanity/_createContext'

/**
 * TODO: remove this context when alternate document-specific context are
 * introduced.
 *
 * The following context is used in the structure tool to set the active
 * document if it's the last pane open in the structure tool. This is a
 * temporary context provider that was introduced when the comments and tasks
 * plugins were refactor and decoupled from the structure tool. ideally this
 * should be removed and replaced with a document-specific context that gives
 * plugin authors access to what the `usePane`, `usePaneRouter`, and
 * `useDocumentPane` provides without exposing specifics from the structure tool
 */
/**
 * @internal
 */
export const IsLastPaneContext = createContext<boolean>(
  'sanity/_singletons/context/is-last-pane',
  false,
)
