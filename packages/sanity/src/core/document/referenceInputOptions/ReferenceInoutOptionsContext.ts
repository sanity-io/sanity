import {Path} from '@sanity/types'
import {createContext} from 'react'
import {TemplatePermissionsResult} from '../../store'

/** @internal */
export interface TemplateOptions {
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
  template: TemplateOptions
}

/** @internal */
export interface EditReferenceLinkComponentProps extends Omit<React.HTMLProps<'a'>, 'children'> {
  documentId: string
  documentType: string
  parentRefPath: Path
  template?: TemplateOptions
  children: React.ReactNode
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
  EditReferenceLinkComponent?: React.ComponentType<EditReferenceLinkComponentProps>

  initialValueTemplateItems?: TemplatePermissionsResult[]

  /**
   * Similar to `EditReferenceChildLink` expect without the wrapping component
   */
  onEditReference?: (options: EditReferenceOptions) => void
}

// a simple alias for conventions sake
export type ReferenceInputOptionsContextValue = ReferenceInputOptions

export const ReferenceInputOptionsContext = createContext<ReferenceInputOptionsContextValue>({})
