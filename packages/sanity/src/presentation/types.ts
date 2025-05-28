import {type ClientPerspective, type StackablePerspective} from '@sanity/client'
import {type ChannelInstance} from '@sanity/comlink'
import {
  type LoaderControllerMsg,
  type LoaderNodeMsg,
  type VisualEditingControllerMsg,
  type VisualEditingNodeMsg,
} from '@sanity/presentation-comlink'
import {type PreviewUrlResolver} from '@sanity/preview-url-secret/define-preview-url'
import {type ComponentType} from 'react'
import {type Observable} from 'rxjs'
import {type DocumentStore, type SanityClient} from 'sanity'

import {type PreviewHeaderProps} from './preview/PreviewHeader'

export type {PreviewUrlResolver}

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
export interface PreviewUrlAllowOptionContext {
  client: SanityClient
  /**
   * Equivalent to `location.origin`
   */
  origin: string
  /**
   * The initial URL of the preview
   */
  initialUrl: URL
}

/** @public */
export interface PreviewUrlInitialOptionContext {
  client: SanityClient
  /**
   * Equivalent to `location.origin`
   */
  origin: string
}

/** @public */
export interface PreviewUrlPreviewModeOptionContext {
  client: SanityClient
  /**
   * Equivalent to `location.origin`
   */
  origin: string
  /**
   * The origin on the URL that will be used in the preview iframe
   */
  targetOrigin: string
}

/** @public */
export type PreviewUrlAllowOption =
  | string
  | string[]
  | ((context: PreviewUrlAllowOptionContext) => string | string[] | Promise<string | string[]>)

/** @public */
export type PreviewUrlInitialOption =
  | string
  | ((context: PreviewUrlInitialOptionContext) => string | Promise<string>)

/** @public */
export type PreviewUrlPreviewModeOption =
  | PreviewUrlPreviewMode
  | ((
      context: PreviewUrlPreviewModeOptionContext,
    ) => false | PreviewUrlPreviewMode | Promise<false | PreviewUrlPreviewMode>)

/** @public */
export interface PreviewUrlPreviewMode {
  /**
   * The route that enables Preview Mode
   * @example '/api/preview'
   * @example '/api/draft-mode/enable'
   */
  enable: string
  /**
   * Allow sharing access to a preview with others.
   * This is enabled/disabled in the Presentation Tool. It's initially disabled, and can be enabled by someone who has access to creating draft documents in the Studio.
   * Custom roles can limit access to `_id in path("drafts.**") && _type == "sanity.previewUrlSecret"`.
   * This will create a secret that is valid until sharing is disabled. Turning sharing off and on again will create a new secret and can be used to remove access for folks that got the link in an email but should no longer have access.
   * Share URLs to previews will append this secret and give access to anyone who is given the URL, they don't need to be logged into the Studio or to Vercel.
   */
  shareAccess?: boolean
  /**
   * The route that reports if Preview Mode is enabled or not, useful for debugging
   * @example '/api/check-preview'
   * @deprecated - this API is not yet implemented
   */
  check?: string
  /**
   * The route that disables Preview Mode, useful for debugging
   * @example '/api/disable-preview'
   * @deprecated - this API is not yet implemented
   */
  disable?: string
}

/**
 * @public
 */
export interface PreviewUrlResolverOptions {
  /**
   * The default preview URL, used when the URL to use is not yet known, or there's no `&preview=...` search param in the studio URL.
   * @example '/en/preview?q=shoes'
   * @example 'https://example.com'
   * @defaultValue `location.origin`
   */
  initial?: PreviewUrlInitialOption
  previewMode?: PreviewUrlPreviewModeOption
  /**
   * @defaultValue `location.origin`
   * @deprecated - use `previewMode.initial` instead
   */
  origin?: string
  /**
   * @defaultValue '/'
   * @deprecated - use `previewMode.initial` instead
   */
  preview?: string
  /**
   * @deprecated - use `previewMode` instead
   */
  draftMode?: {
    /**
     * @deprecated - use `previewMode.enable` instead
     */
    enable: string
    /**
     * @deprecated - use `previewMode.shareAccess` instead
     */
    shareAccess?: boolean
    /**
     * @deprecated - use `previewMode.check` instead
     */
    check?: string
    /**
     * @deprecated - use `previewMode.disable` instead
     */
    disable?: string
  }
}

/**
 * @deprecated the `previewUrl.initial`, `previewUrl.allowOrigins` and `previewUrl.previewMode.enable` supports async functions that offer advanced control over how preview URLs are resolved
 * @public
 */
export type DeprecatedPreviewUrlResolver = PreviewUrlResolver<SanityClient>

/** @public */
export type PreviewUrlOption = string | DeprecatedPreviewUrlResolver | PreviewUrlResolverOptions

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
  allowOrigins?: PreviewUrlAllowOption
  previewUrl: PreviewUrlOption
  /**
   * @deprecated use `resolve.locations` instead
   */
  locate?: DocumentLocationResolver
  resolve?: {
    mainDocuments?: DocumentResolver[]
    locations?: DocumentLocationResolvers | DocumentLocationResolver
  }
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
