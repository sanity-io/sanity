import {randomKey} from '@sanity/util/content'
import {createContext, useContext} from 'react'

export const defaultKeyGenerator = (): string => randomKey(12)

/**
 * A React context for sharing the editor's keyGenerator.
 */
export const PortableTextEditorKeyGeneratorContext =
  createContext<() => string>(defaultKeyGenerator)

/**
 * Get the current editor selection from the React context.
 */
export const usePortableTextEditorKeyGenerator = (): (() => string) => {
  const keyGenerator = useContext(PortableTextEditorKeyGeneratorContext)

  if (keyGenerator === undefined) {
    throw new Error(
      `The \`usePortableTextEditorKeyGenerator\` hook must be used inside the <PortableTextEditor> component's context.`
    )
  }
  return keyGenerator
}
