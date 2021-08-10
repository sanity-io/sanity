import {createContext, useContext} from 'react'
import {PortableTextBlock} from '../../types/portableText'

/**
 * A React context for sharing the editor value.
 */

export const PortableTextEditorValueContext = createContext<PortableTextBlock[] | undefined>(
  undefined
)

/**
 * Get the current editor value from the React context.
 */

export const usePortableTextEditorValue = () => {
  return useContext(PortableTextEditorValueContext)
}
