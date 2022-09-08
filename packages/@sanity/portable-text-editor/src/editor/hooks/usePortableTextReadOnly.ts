import {createContext, useContext} from 'react'

/**
 * A React context for sharing the editor's readOnly status.
 */

export const PortableTextEditorReadOnlyContext = createContext<boolean>(false)

/**
 * Get the current editor selection from the React context.
 */

export const usePortableTextEditorReadOnlyStatus = (): boolean => {
  const readOnly = useContext(PortableTextEditorReadOnlyContext)

  if (readOnly === undefined) {
    throw new Error(
      `The \`usePortableTextEditorReadOnly\` hook must be used inside the <PortableTextEditor> component's context.`
    )
  }
  return readOnly
}
