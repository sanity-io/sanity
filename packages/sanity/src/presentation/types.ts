import {type ClientPerspective, type StackablePerspective} from '@sanity/client'
import {type ChannelInstance} from '@sanity/comlink'
import {
  type LoaderControllerMsg,
  type LoaderNodeMsg,
  type VisualEditingControllerMsg,
  type VisualEditingNodeMsg,
} from '@sanity/presentation-comlink'
import {
  type PreviewUrlResolver,
  type PreviewUrlResolverOptions,
} from '@sanity/preview-url-secret/define-preview-url'
import {type ComponentType} from 'react'
import {type Observable} from 'rxjs'
import {type DocumentStore, type SanityClient} from 'sanity'

import {type PreviewHeaderProps} from './preview/PreviewHeader'

export type {PreviewUrlResolver, PreviewUrlResolverOptions}

/**
 * Represents a document location
 * @param title - Title of the document
 * @param href - URL of the document location
 * @public
 */
export interface DocumentLocation {
  title: string
  href: string
}

/**
 * State for describing document locations or providing a message if no document
 * locations are unavailable
 * @param locations - Array of document locations
 * @param message - Message to display if locations are unavailable
 * @param tone - Tone of the message
 * @public
 */
export interface DocumentLocationsState {
  locations?: DocumentLocation[]
  message?: string
  tone?: 'positive' | 'caution' | 'critical'
}

/**
 * @internal
 */
export type DocumentLocationsStatus = 'empty' | 'resolving' | 'resolved'

/**
 * Function used for advanced document location resolution
 * @param params - Object with document `id` and document `type` properties
 * @param context - Object with `documentStore` property for creating listenQuery subscriptions
 * @returns Document location state, optionally as an Observable, or null/undefined if no locations are available
 * @public
 */
export type DocumentLocationResolver = (
  params: {
    id: string
    type: string
    version: string | undefined
    perspectiveStack: StackablePerspective[]
  },
  context: {documentStore: DocumentStore},
) =>
  | DocumentLocationsState
  | null
  | undefined
  | Observable<DocumentLocationsState | null | undefined>

/** @public */
export interface NavigatorOptions {
  minWidth?: number
  maxWidth?: number
  component: ComponentType
}

/** @public */
export interface HeaderOptions {
  component: ComponentType<PreviewHeaderProps>
}

/** @public */
export type PreviewUrlOption = string | PreviewUrlResolver<SanityClient> | PreviewUrlResolverOptions

/**
 * Object of document location resolver definitions per document type
 * @public
 */
export type DocumentLocationResolvers = Record<
  string,
  DocumentLocationResolverObject | DocumentLocationsState
>

/**
 * Document location resolver object
 * @param select - object for selecting document fields
 * @param resolve - function that accepts a document with the selected fields and returns an optional document location state
 * @public
 */
export type DocumentLocationResolverObject<K extends string = string> = {
  select: Record<K, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (value: Record<K, any> | null) => DocumentLocationsState | null | undefined | void
}

/**
 * @public
 */
export interface DocumentResolverContext {
  origin: string | undefined
  params: Record<string, string>
  path: string
}

/**
 * @public
 */
export type ContextFn<T> = (context: DocumentResolverContext) => T

/**
 * Object for resolving a document for a given route pattern
 * @public
 */
export type DocumentResolver =
  | {
      route: string | Array<string>
      type: string
      filter?: never
      params?: never
      resolve?: never
    }
  | {
      route: string | Array<string>
      type?: never
      filter: ContextFn<string> | string
      params?: ContextFn<Record<string, string>> | Record<string, string>
      resolve?: never
    }
  | {
      route: string | Array<string>
      type?: never
      filter?: never
      params?: never
      resolve: ContextFn<
        | {
            filter: string
            params?: Record<string, string>
          }
        | undefined
      >
    }

/**
 * @public
 */
export interface PresentationPluginOptions {
  devMode?: boolean | (() => boolean)
  icon?: ComponentType
  name?: string
  title?: string
  /**
   * @deprecated use `resolve.locations` instead
   */
  locate?: DocumentLocationResolver
  resolve?: {
    mainDocuments?: DocumentResolver[]
    locations?: DocumentLocationResolvers | DocumentLocationResolver
  }
  previewUrl?: PreviewUrlOption
  components?: {
    unstable_header?: HeaderOptions
    unstable_navigator?: NavigatorOptions
  }
  /**
   * @deprecated this feature flag is no longer needed
   */
  unstable_showUnsafeShareUrl?: boolean
}

/**
 * Presentation specific state that is stored in the pathname section of the URL
 * @public
 */
export interface PresentationStateParams {
  type?: string
  id?: string
  path?: string
}

/**
 * Presentation specific URL search parameters, they should persist when
 * navigating between the document pane and document list pane
 * @public
 */
export interface PresentationSearchParams {
  preview?: string
  perspective?: string
  viewport?: string
}

/**
 * Document Pane specific URL search parameters, they should not persist when
 * navigating between the document pane and document list pane
 * @public
 */
export interface StructureDocumentPaneParams extends InspectorTab {
  inspect?: string
  path?: string
  rev?: string
  since?: string
  template?: string
  templateParams?: string
  view?: string

  // assist
  pathKey?: string
  instruction?: string

  // comments
  comment?: string
}

/**
 * parameters for the changes inspector
 * @public
 */
export interface InspectorTab {
  changesInspectorTab?: 'history' | 'review'
}

/**
 * All possible URL search parameters used by the Presentation tool
 * @public
 */
export interface CombinedSearchParams
  extends StructureDocumentPaneParams,
    PresentationSearchParams,
    InspectorTab {}

/**
 * All possible parameters that can be used to describe the state of the
 * Presentation tool, stored in the pathname and as search parameters of the URL
 * @public
 */
export interface PresentationParamsContextValue
  extends PresentationStateParams,
    CombinedSearchParams,
    InspectorTab {}

/** @public */
export type PresentationNavigate = (
  nextState: PresentationStateParams,
  nextSearchState?: CombinedSearchParams,
  forceReplace?: boolean,
) => void

/** @public */
export type PresentationPerspective = Exclude<ClientPerspective, 'raw'>

/** @public */
export type PresentationViewport = 'desktop' | 'mobile'

/** @internal */
export interface FrameState {
  title: string | undefined
  url: string | undefined
}

/**
 * @internal
 */
export interface MainDocument {
  _id: string
  _type: string
}

/**
 * @internal
 */
export interface MainDocumentState {
  path: string
  document: MainDocument | undefined
}

/**
 * @internal
 */
export type VisualEditingConnection = ChannelInstance<
  VisualEditingControllerMsg,
  VisualEditingNodeMsg
>
/**
 * @internal
 */
export type LoaderConnection = ChannelInstance<LoaderControllerMsg, LoaderNodeMsg>

/** @public */
export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'idle'

/** @public */
export type PresentationNavigateContextValue = (
  preview: string | undefined,
  document?: {type: string; id: string},
) => void

export interface PresentationContextValue {
  devMode: boolean
  name: string
  navigate: PresentationNavigate
  params: PresentationParamsContextValue
  structureParams: StructureDocumentPaneParams
  searchParams: PresentationSearchParams
}
