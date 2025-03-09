import {type Path} from '@sanity/types'
import {type ComponentType, type HTMLProps, type ReactNode, useContext, useMemo} from 'react'
import {ReferenceInputOptionsContext} from 'sanity/_singletons'

import {type ReleaseId} from '../../../perspective/types'
import {type TemplatePermissionsResult} from '../../../store'

/** @internal */
export interface TemplateOption {
  id: string
  params?: Record<string, string | number | boolean>
}

/**
 * @internal
 */
export interface EditReferenceOptions {
  id: string
  type: string
  parentRefPath: Path
  template: TemplateOption
  version?: ReleaseId
}

/** @internal */
export interface EditReferenceLinkComponentProps {
  documentId: string
  documentType: string
  parentRefPath: Path
  template?: TemplateOption
  children: ReactNode
}

/**
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

  /**
   * Prevent creation of documents from reference fields.
   */
  disableNew?: boolean
}

/**
 * @internal
 */
export function useReferenceInputOptions() {
  return useContext(ReferenceInputOptionsContext)
}

/**
 * @internal
 */
export function ReferenceInputOptionsProvider(
  props: ReferenceInputOptions & {children: ReactNode},
) {
  const {
    children,
    activePath,
    EditReferenceLinkComponent,
    onEditReference,
    initialValueTemplateItems,
    disableNew,
  } = props

  const contextValue = useMemo(
    () => ({
      activePath,
      EditReferenceLinkComponent,
      onEditReference,
      initialValueTemplateItems,
      disableNew,
    }),
    [
      activePath,
      EditReferenceLinkComponent,
      onEditReference,
      initialValueTemplateItems,
      disableNew,
    ],
  )

  return (
    <ReferenceInputOptionsContext.Provider value={contextValue}>
      {children}
    </ReferenceInputOptionsContext.Provider>
  )
}
