import {createContext, useContext} from 'react'
import {InvalidValueResolution} from '../../types/editor'

/**
 * A React context for sharing the editor's validation of the value.
 */
export const PortableTextEditorValidationContext = createContext<{
  valid: boolean
  resolution: InvalidValueResolution | null
} | null>(null)

/**
 * Get the current validation from the React context.
 */
export const usePortableTextEditorValidation = (): {
  valid: boolean
  resolution: InvalidValueResolution | null
} | null => {
  const validation = useContext(PortableTextEditorValidationContext)

  if (validation === undefined) {
    throw new Error(
      `The \`usePortableTextEditorValidation\` hook must be used inside the <PortableTextEditor> component's context.`
    )
  }
  return validation
}
