import React, {createContext, useContext, useMemo} from 'react'
import {Path} from '@sanity/types'
import type {NewDocumentOption} from '@sanity/base/_internal'

const Context = createContext<ReferenceInputOptions>({})

/**
 * unstable
 * @internal
 */
export interface EditReferenceOptions {
  documentId: string
  documentType: string
  parentRefPath: Path
  template?: string
  templateParams?: unknown
}

export type EditReferenceLinkComponentProps = EditReferenceOptions & React.HTMLProps<Element>

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
  EditReferenceLinkComponent?: React.ComponentType<EditReferenceLinkComponentProps>
  /**
   * Similar to `ReferenceChildLink` expect without the wrapping component
   */
  onEditReference?: (options: EditReferenceOptions) => void

  /**
   * Used to create new documents from the "create new" button
   */
  newDocumentOptions?: NewDocumentOption[]
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
  const {
    children,
    activePath,
    newDocumentOptions,
    EditReferenceLinkComponent,
    onEditReference,
  } = props

  const contextValue = useMemo(
    () => ({
      activePath,
      newDocumentOptions,
      EditReferenceLinkComponent,
      onEditReference,
    }),
    [activePath, newDocumentOptions, EditReferenceLinkComponent, onEditReference]
  )

  return <Context.Provider value={contextValue}>{children}</Context.Provider>
}
