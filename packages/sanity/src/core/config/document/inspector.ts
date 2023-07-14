import {ButtonTone} from '@sanity/ui'
import {ComponentType} from 'react'

/** @hidden @beta */
export interface DocumentInspectorProps {
  documentId: string
  documentType: string
  onClose: () => void
}

/** @hidden @beta */
export type DocumentInspectorComponent = ComponentType<DocumentInspectorProps>

/** @hidden @beta */
export interface DocumentInspectorUseMenuItemProps {
  documentId: string
  documentType: string
}

/** @hidden @beta */
export interface DocumentInspectorMenuItem {
  hidden?: boolean
  hotkeys?: string[]
  icon?: ComponentType
  showAsAction?: boolean
  status?: ButtonTone
  title: string
  tone?: ButtonTone
}

/** @hidden @beta */
export interface DocumentInspector {
  name: string
  component: DocumentInspectorComponent
  /**
   * Hook for defining a menu item for the inspector.
   */
  useMenuItem?: (props: DocumentInspectorUseMenuItemProps) => DocumentInspectorMenuItem

  /**
   * Callback for when the inspector is closed, which can be used to clean up custom document pane
   * parameters.
   */
  onClose?: (ctx: {params: Record<string, string | undefined>}) => {
    params: Record<string, string | undefined>
  }

  /**
   * Callback for when the inspector is opened, which can be used to set custom document pane
   * parameters.
   */
  onOpen?: (ctx: {params: Record<string, string | undefined>}) => {
    params: Record<string, string | undefined>
  }
}

/**
 * Define a document inspector to be used in Sanity configuration.
 *
 * @example
 *
 * ```ts
 * // sanity.config.ts
 *
 * import {RocketIcon} from '@sanity/icons'
 * import {defineConfig, defineDocumentInspector} from 'sanity'
 *
 * const customInspector = defineDocumentInspector({
 *   name: 'custom',
 *   useMenuItem: () => ({
 *     icon: RocketIcon,
 *     showAsAction: true,
 *     title: 'Custom'
 *   }),
 *   component: lazy(() => import('./inspectors/custom')),
 * })
 *
 * export default defineConfig({
 *   // ...
 *
 *   document: {
 *     inspectors: (prev) => [customInspector, ...prev],
 *   },
 * })
 * ```
 *
 * @hidden @beta
 * */
export function defineDocumentInspector(inspector: DocumentInspector): DocumentInspector {
  return inspector
}
