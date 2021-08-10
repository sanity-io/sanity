import {createContext, useContext} from 'react'
import {EditorSelection} from '../../types/editor'

/**
 * A React context for sharing the editor selection.
 */

export const PortableTextEditorSelectionContext = createContext<EditorSelection>(null)

/**
 * Get the current editor selection from the React context.
 */

export const usePortableTextEditorSelection = () => {
  const selection = useContext(PortableTextEditorSelectionContext)

  if (selection === undefined) {
    throw new Error(
      `The \`usePortableTextEditorSelection\` hook must be used inside the <PortableTextEditor> component's context.`
    )
  }
  return selection
}
