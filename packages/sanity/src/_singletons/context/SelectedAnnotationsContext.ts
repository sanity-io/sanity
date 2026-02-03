import type {ObjectSchemaType} from '@sanity/types'
import {createContext} from 'sanity/_createContext'

/**
 * Entry representing a selected annotation for the combined popover
 * @internal
 */
export interface AnnotationEntry {
  key: string
  title: string
  schemaType: ObjectSchemaType
  onOpen: () => void
  onRemove: () => void
  referenceElement: HTMLElement | null
}

/**
 * Context value for tracking selected annotations
 * @internal
 */
export interface SelectedAnnotationsContextValue {
  register: (entry: AnnotationEntry) => void
  unregister: (key: string) => void
  annotations: AnnotationEntry[]
}

/**
 * Context for managing selected annotations in the Portable Text editor.
 * Used by CombinedAnnotationPopover to show all active annotations in a single popover.
 * @internal
 */
export const SelectedAnnotationsContext = createContext<SelectedAnnotationsContextValue | null>(
  'sanity/_singletons/context/selected-annotations',
  null,
)
