import React, {ComponentType, createContext, HTMLProps, useContext, useMemo} from 'react'
import {Path} from '@sanity/types'
import {TemplatePermissionsResult} from '../../../datastores'

const Context = createContext<ReferenceInputOptions>({})

export interface TemplateOption {
  id: string
  params?: Record<string, string | number | boolean>
}
/**
 * unstable
 * @internal
 */
export interface EditReferenceOptions {
  id: string
  type: string
  parentRefPath: Path
  template: TemplateOption
}

export interface EditReferenceLinkComponentProps {
  documentId: string
  documentType: string
  parentRefPath: Path
  template?: TemplateOption
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

  initialValueTemplateItems?: TemplatePermissionsResult[]

  /**
   * Similar to `EditReferenceChildLink` expect without the wrapping component
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
  const {
    children,
    activePath,
    EditReferenceLinkComponent,
    onEditReference,
    initialValueTemplateItems,
  } = props

  const contextValue = useMemo(
    () => ({
      activePath,
      EditReferenceLinkComponent,
      onEditReference,
      initialValueTemplateItems,
    }),
    [activePath, EditReferenceLinkComponent, onEditReference, initialValueTemplateItems]
  )

  return <Context.Provider value={contextValue}>{children}</Context.Provider>
}
