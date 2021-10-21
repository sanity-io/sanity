import React, {ComponentType, createContext, HTMLProps, useContext, useMemo} from 'react'
import {Path} from '@sanity/types'

const Context = createContext<ReferenceInputOptions>({})

/**
 * unstable
 * @internal
 */
export interface EditReferenceOptions {
  id: string
  parentRefPath: Path
  type: string
}

export interface EditReferenceLinkComponentProps {
  documentId: string
  documentType: string
  parentRefPath: Path
  children: React.ReactNode
}

/**
 * unstable
 * @internal
 */
export interface ReferenceInputOptions {
  /**
   * Represents the highlighted path if ths current document has a related open
   * child (e.g. reference in place).
   */
  activePath?: {path: Path; state: 'selected' | 'pressed' | 'none'}
  /**
   * A specialized `EditReferenceLinkComponent` component that takes in the needed props to open a
   * referenced document to the right
   */
  EditReferenceLinkComponent?: ComponentType<
    Omit<HTMLProps<'a'>, 'children'> & EditReferenceLinkComponentProps
  >
  /**
   * Similar to `ReferenceChildLink` expect without the wrapping component
   */
  onEditReference?: (options: EditReferenceOptions) => void
}

/**
 * unstable
 * @internal
 */
export function useReferenceInputOptions() {
  return useContext(Context)
}

/**
 * unstable
 * @internal
 */
export function ReferenceInputOptionsProvider(
  props: ReferenceInputOptions & {children: React.ReactNode}
) {
  const {children, activePath, EditReferenceLinkComponent, onEditReference} = props

  const contextValue = useMemo(
    () => ({
      activePath,
      EditReferenceLinkComponent,
      onEditReference,
    }),
    [activePath, EditReferenceLinkComponent, onEditReference]
  )

  return <Context.Provider value={contextValue}>{children}</Context.Provider>
}
