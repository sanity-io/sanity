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
 * @public
 */
export interface DocumentLocation {
  /**
   * Title of the document
   */
  title: string
  /**
   * URL of the document location
   */
  href: string
  /**
   * Optional icon component to display instead of the default DesktopIcon
   */
  icon?: ComponentType
  /**
   * Whether to show the href below the title. Defaults to true
   */
  showHref?: boolean
}

/**
 * State for describing document locations or providing a message if locations are unavailable
 * @public
 */
export interface DocumentLocationsState {
  /**
   * Array of document locations
   */
  locations?: DocumentLocation[]
  /**
   * Message to display if locations are unavailable
   */
  message?: string
  /**
   * Tone of the message
   */
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

/**
 * Configuration options for Presentation tool's optional navigator component
 * The navigator appears as a resizable sidebar panel
 *
 * @public
 */
export interface NavigatorOptions {
  /**
   * Minimum width of the navigator panel in pixels
   */
  minWidth?: number
  /**
   * Maximum width of the navigator panel in pixels
   */
  maxWidth?: number
  /**
   * React component to render in the navigator panel
   */
  component: ComponentType
}

/**
 * Configuration options for Presentation tool's optional custom preview header component
 *
 * @public
 */
export interface HeaderOptions {
  /**
   * React component to render as the preview header, receives PreviewHeaderProps
   */
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
   * @deprecated - use `initial` instead
   */
  origin?: string
  /**
   * @defaultValue '/'
   * @deprecated - use `initial` instead
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
 * @public
 */
export type DocumentLocationResolverObject<K extends string = string> = {
  /**
   * Object for selecting document fields
   */
  select: Record<K, string>
  /**
   * Function that accepts a document with the selected fields and returns an optional document location state
   */
  // oxlint-disable-next-line no-explicit-any
  resolve: (value: Record<K, any> | null) => DocumentLocationsState | null | undefined | void
}

/**
 * Context object passed to functions used in `DocumentResolver` definitions.
 * Contains information about the current URL being matched against route patterns.
 *
 * @example
 * For a route pattern `/blog/:category/:slug` matching URL `https://example.com/blog/tech/hello-world`:
 * ```ts
 * {
 *   origin: 'https://example.com',
 *   params: { category: 'tech', slug: 'hello-world' },
 *   path: '/blog/tech/hello-world'
 * }
 * ```
 *
 * @public
 */
export interface DocumentResolverContext {
  /**
   * The origin (protocol + hostname + port) of the matched URL
   */
  origin: string
  /**
   * Extracted route parameters from URL path matching (e.g., `:slug` → `{slug: 'value'}`)
   */
  params: Record<string, string>
  /**
   * The pathname of the matched URL (without query parameters)
   */
  path: string
}

/**
 * Generic function type used in `DocumentResolver` definitions that receives a `DocumentResolverContext` and returns a computed value.
 * @param context - `DocumentResolverContext` containing route information (origin, params, path)
 * @returns Computed value based on the context (typically a string for filters or an object for parameters)
 * @public
 */
export type ContextFn<T> = (context: DocumentResolverContext) => T

/**
 * Configuration object for resolving documents based on URL route patterns.
 * Used to define the main document when navigating to specific URLs in
 * Presentation tool's preview iframe.
 *
 * Supports three different resolution strategies:
 *
 * **Simple type-based resolution:**
 * ```ts
 * {
 *   route: '/blog',
 *   type: 'blog'  // Useful for singleton documents
 * }
 * ```
 *
 * **GROQ filter-based resolution:**
 * ```ts
 * {
 *   route: '/blog/:category/:slug',
 *   filter: ({ params }) => `_type == "post" && slug.current == "${params.slug}"`,
 *   params: ({ params }) => ({ category: params.category })
 * }
 * ```
 *
 * **Advanced resolution with custom logic:**
 * ```ts
 * {
 *   route: '/products/:id',
 *   resolve: ({ params }) => ({
 *     filter: `_type == "product" && _id == $id`,
 *     params: { id: params.id }
 *   })
 * }
 * ```
 *
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
 * Configuration options for the Presentation tool.
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
  parentRefPath?: string
  path?: string
  rev?: string
  since?: string
  template?: string
  templateParams?: string
  version?: string
  view?: string

  // assist
  pathKey?: string
  instruction?: string

  // comments
  comment?: string

  scheduledDraft?: string
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
  extends StructureDocumentPaneParams, PresentationSearchParams {}

/**
 * All possible parameters that can be used to describe the state of the
 * Presentation tool, stored in the pathname and as search parameters of the URL
 * @public
 */
export interface PresentationParamsContextValue
  extends PresentationStateParams, CombinedSearchParams {}

/** @public */
export type PresentationNavigateOptions = (
  | {state: PresentationStateParams; params?: CombinedSearchParams}
  | {params: CombinedSearchParams; state?: PresentationStateParams}
) & {replace?: boolean}

/** @public */
export type PresentationNavigate = (options: PresentationNavigateOptions) => void

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

/**
 * Represents the connection status between the Sanity Studio and Presentation's preview iframe.
 * @public
 */
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
