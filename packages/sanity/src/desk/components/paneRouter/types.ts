import type React from 'react'
import {Path} from '@sanity/types'
import {RouterPanes, RouterPaneSibling} from '../../types'

export interface ChildLinkProps {
  childId: string
  childParameters?: Record<string, string>
  childPayload?: unknown
  children?: React.ReactNode
}

export interface BackLinkProps {
  children?: React.ReactNode
}

export interface ReferenceChildLinkProps {
  documentId: string
  documentType: string
  parentRefPath: Path
  template?: {id: string; params?: Record<string, string | number | boolean>}
  children: React.ReactNode
}

export interface ParameterizedLinkProps {
  params?: Record<string, string>
  payload?: unknown
}

export interface EditReferenceOptions {
  parentRefPath: Path
  id: string
  type: string
  template: {id: string; params?: Record<string, string | number | boolean>}
}

export interface PaneRouterContextValue {
  /**
   * Zero-based index (position) of pane, visually
   */
  index: number

  /**
   * Zero-based index of pane group (within URL structure)
   */
  groupIndex: number

  /**
   * Zero-based index of pane within sibling group
   */
  siblingIndex: number

  /**
   * Payload of the current pane
   */
  payload?: unknown

  /**
   * Params of the current pane
   */
  params?: RouterPaneSibling['params']

  /**
   * Whether or not the pane has any siblings (within the same group)
   */
  hasGroupSiblings: boolean

  /**
   * The length of the current group
   */
  groupLength: number

  /**
   * Current router state for the "panes" property
   */
  routerPanesState: RouterPanes

  /**
   * Curried StateLink that passes the correct state automatically
   */
  ChildLink: React.ComponentType<ChildLinkProps>

  /**
   * Curried StateLink that pops off the last pane group
   */
  BackLink: React.ComponentType<BackLinkProps>

  /**
   * A specialized `ChildLink` that takes in the needed props to open a
   * referenced document to the right
   */
  ReferenceChildLink: React.ComponentType<ReferenceChildLinkProps>

  /**
   * Similar to `ReferenceChildLink` expect without the wrapping component
   */
  handleEditReference: (options: EditReferenceOptions) => void

  /**
   * Curried StateLink that passed the correct state, but merges params/payload
   */
  ParameterizedLink: React.ComponentType<ParameterizedLinkProps>

  /**
   * Replaces the current pane with a new one
   */
  replaceCurrent: (pane: {id?: string; payload?: unknown; params?: Record<string, string>}) => void

  /**
   * Removes the current pane from the group
   */
  closeCurrent: () => void

  /**
   * Duplicate the current pane, with optional overrides for item ID and parameters
   */
  duplicateCurrent: (pane?: {payload?: unknown; params?: Record<string, string>}) => void

  /**
   * Set the current "view" for the pane
   */
  setView: (viewId: string | null) => void

  /**
   * Set the parameters for the current pane
   */
  setParams: (params: Record<string, string | undefined>) => void

  /**
   * Set the payload for the current pane
   */
  setPayload: (payload: unknown) => void

  /**
   * Proxied navigation to a given intent. Consider just exposing `router` instead?
   */
  navigateIntent: (
    intentName: string,
    params: Record<string, string>,
    options?: {replace?: boolean}
  ) => void
}
