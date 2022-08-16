declare module 'all:part:@sanity/base/absolutes' {
  const components: React.ComponentType[]
  export default components
}

declare module 'all:part:@sanity/base/component'
declare module 'all:part:@sanity/desk-tool/filter-fields-fn?' {
  declare const filterFields: Observable[]
  export default filterFields
}

declare module 'part:@sanity/desk-tool/filter-fields-fn?' {
  import type {Observable} from 'rxjs'
  declare const filterField: Observable<{
    (type: ObjectSchemaTypeWithOptions, field: ObjectField): boolean
  }>
  export default filterField
}

declare module 'all:part:@sanity/base/diff-resolver' {
  type DiffComponent = React.ComponentType<unknown>
  type DiffResolver = (schemaType: unknown) => DiffComponent | undefined

  const diffResolvers: DiffResolver[]
  export default diffResolvers
}

declare module 'all:part:@sanity/base/schema-type'
declare module 'all:part:@sanity/base/tool' {
  const tools: {
    canHandleIntent?: (
      intent: Record<string, any>,
      params: Record<string, any>,
      state: Record<string, any>
    ) => void
    component?: React.ComponentType<{tool: string}>
    icon?: React.ComponentType
    getIntentState?: (
      intent: Record<string, any>,
      params: Record<string, any>,
      state: Record<string, any>,
      payload: Record<string, any>
    ) => void
    name: string
    title: string
    router?: Record<string, any>
  }[]
  export default tools
}

declare module 'part:@sanity/base/actions/utils'

declare module 'part:@sanity/base/app-loading-screen' {
  const AppLoadingScreen: React.ComponentType<{text: React.ReactNode}>
  export default AppLoadingScreen
}

declare module 'part:@sanity/base/arrow-drop-down'
declare module 'part:@sanity/base/arrow-right'
declare module 'part:@sanity/base/asset-url-builder'
declare module 'part:@sanity/base/authentication-fetcher' {
  interface Role {
    name: string
    title: string
    description: string
  }
  interface CurrentUser {
    id: string
    name: string
    email: string
    profileImage?: string
    provider?: string
    role: string | null
    roles: Role[]
  }

  interface Provider {
    name: string
    title: string
    url: string
  }

  const fetcher: {
    getProviders: () => Promise<Provider[]>
    getCurrentUser: () => Promise<CurrentUser | null>
    logout: () => Promise<void>
  }
  export default fetcher
}
declare module 'part:@sanity/base/brand-logo' {
  declare const BrandLogo: React.ComponentType
  export default BrandLogo
}
declare module 'part:@sanity/base/brand-logo?' {
  declare const BrandLogo: React.ComponentType | undefined
  export default BrandLogo
}
declare module 'part:@sanity/base/client' {
  import type {ClientConfig, SanityClient, SanityClient} from '@sanity/client'

  type StudioClient = SanityClient & {withConfig: (config: Partial<ClientConfig>) => SanityClient}

  declare const client: StudioClient
  export default client
}
declare module 'part:@sanity/base/client?' {
  import type client from 'part:@sanity/base/client'

  type StudioClient = SanityClient & {withConfig: (config: Partial<ClientConfig>) => SanityClient}

  declare const client: StudioClient | void
  export default maybeClient
}
declare module 'part:@sanity/base/configure-client?' {
  import type {SanityClient as OriginalSanityClient} from '@sanity/client'

  type Configurer = (
    client: OriginalSanityClient
  ) => OriginalSanityClient & {withConfig: (config: Partial<ClientConfig>) => SanityClient}
  const configure: Configurer | undefined

  export default configure
}
declare module 'part:@sanity/base/document'
declare module 'part:@sanity/base/document-actions/resolver'
declare module 'part:@sanity/base/document-badges/resolver'
declare module 'part:@sanity/base/initial-value-templates'
declare module 'part:@sanity/base/initial-value-templates?'
declare module 'part:@sanity/base/language-resolver'

declare module 'part:@sanity/base/location' {
  declare const locationStore: {
    actions: {navigate: (newUrl: string, options: Record<string, any>) => void}
    state: Observable<any>
  }

  export default locationStore
}
declare module 'part:@sanity/base/login-dialog'
declare module 'part:@sanity/base/login-dialog-content'

declare module 'part:@sanity/base/login-wrapper?' {
  declare const Component:
    | React.ComponentType<{
        LoadingScreen: React.ReactNode
      }>
    | undefined
  export default Component
}
declare module 'part:@sanity/base/new-document-structure' {
  declare const newDocumentStructure: Record<string, any>
  export default newDocumentStructure
}
declare module 'part:@sanity/base/new-document-structure?' {
  declare const newDocumentStructure: Record<string, any> | undefined
  export default newDocumentStructure
}

declare module 'part:@sanity/base/preview' {
  import type {ImageUrlFitMode, Reference, SanityDocument, SchemaType} from '_self_'
  import type {Observable} from 'rxjs'

  export type MediaDimensions = {
    width?: number
    height?: number
    fit?: ImageUrlFitMode
    aspect?: number
    dpr?: number
  }

  type PreviewLayoutKey = 'default' | 'card' | 'media' | 'detail' | 'inline' | 'block'

  interface PreviewProps<LayoutKey = PreviewLayoutKey> {
    children?: React.ReactNode
    extendedPreview?: unknown
    isPlaceholder?: boolean
    mediaDimensions?: MediaDimensions
    media?:
      | React.ReactNode
      | React.FC<{
          dimensions: MediaDimensions
          layout: LayoutKey
        }>
    progress?: number
    status?: React.ReactNode | React.FC<{layout: LayoutKey}>
    title?: React.ReactNode | React.FC<{layout: LayoutKey}>
    subtitle?: React.ReactNode | React.FC<{layout: LayoutKey}>
    description?: React.ReactNode | React.FC<{layout: LayoutKey}>
  }

  declare const PreviewBase: React.ComponentType<{
    type?: SchemaType
    fields?: string[]
    value: any
    children?: (props: any) => React.ComponentType
    layout: 'default' | 'card' | 'media' | 'detail' | 'inline' | 'block'
  }>

  type previewObserver = (
    value: Reference | string,
    schemaType: SchemaType
  ) => Observable<{snapshot: {title: string}}>

  export const observeForPreview: previewObserver
  export const observePaths: (id: string, paths: string[]) => Observable<Record<string, string>>

  export const SanityDefaultPreview: React.ComponentType<
    {
      _renderAsBlockImage?: boolean
      icon?: React.ComponentType<any> | false
      layout?: 'default' | 'card' | 'media' | 'detail' | 'inline' | 'block'
      value: Partial<SanityDocument>
    } & PreviewProps
  >

  export const PreviewFields: React.ComponentType<{
    document: SanityDocument
    fields: string | string[]
    layout?: 'inline' | 'block' | 'default' | 'card' | 'media' | 'detail'
    type: SchemaType
    children: (snapshot: SanityDocument) => React.ReactElement
  }>

  export default PreviewBase
}

declare module 'part:@sanity/base/preview?' {
  import type {SchemaType} from '_self_'
  const Preview: React.ComponentType<{
    layout: 'default'
    status: React.ReactNode
    type: SchemaType
    value: Record<string, any>
  }>
  export default Preview
}

declare module 'part:@sanity/base/preview-resolver'
declare module 'part:@sanity/base/preview-resolver?'
declare module 'part:@sanity/base/project-fetcher'
declare module 'part:@sanity/base/query-container'
declare module 'part:@sanity/base/root'
declare module 'part:@sanity/base/router' {
  export {
    IntentLink,
    StateLink,
    RouteScope,
    RouterProvider,
    Link,
    HOCRouter,
    resolvePathFromState,
    resolveStateFromPath,
    route,
    Router,
    RouterContext,
    useRouter,
    useRouterState,
    withRouterHOC,
  } from '@sanity/base/src/router'
}
declare module 'part:@sanity/base/sanity-logo'
declare module 'part:@sanity/base/sanity-logo-alpha'
declare module 'part:@sanity/base/sanity-root'
declare module 'part:@sanity/base/sanity-studio-logo'
declare module 'part:@sanity/base/schema' {
  import type {SchemaType} from '_self_'

  interface Schema {
    _validation: {
      path: Array<string | number | {_key: string}>
      problems: {message: string; severity: string}[]
    }[]
    name: string
    get: (typeName: string) => SchemaType | undefined
    has: (typeName: string) => boolean
    getTypeNames(): string[]
  }

  const schema: Schema
  export default schema
}

declare module 'part:@sanity/base/schema?' {
  import type schema from 'part:@sanity/base/schema'
  declare const maybeSchema: typeof schema | void
  export default maybeSchema
}

declare module 'part:@sanity/base/schema-creator'
declare module 'part:@sanity/base/schema-type'
declare module 'part:@sanity/base/search' {
  import type {Observable} from 'rxjs'
  import type {SearchTerms} from '@sanity/base'

  declare const search: (
    searchTerms: string | SearchTerms,
    searchOpts?: SearchOptions,
    groqComments?: string[]
  ) => Observable
  export default search
}

declare module 'part:@sanity/base/search/weighted'

declare module 'part:@sanity/base/settings' {
  export interface SettingsNamespace<ValueType> {
    forKey: (
      key: string
    ) => {
      listen: (defaultValue?: ValueType) => Observable<ValueType>
      set: (val: ValueType) => void
    }
    forNamespace: (namespaceKey: string | null) => SettingsNamespace<ValueType>
  }

  export interface SettingsStore {
    forNamespace: <ValueType>(namespaceKey: string) => SettingsNamespace<ValueType>
  }

  declare const settings: SettingsStore

  export default settings
}

declare module 'part:@sanity/base/tool'
declare module 'part:@sanity/base/user'
declare module 'part:@sanity/base/grants'
declare module 'part:@sanity/base/util/document-action-utils' {
  export const isActionEnabled: (schema: Schema, actionName: string) => boolean
}
declare module 'part:@sanity/base/util/draft-utils' {
  export declare const collate: (
    documents: SanityDocument[]
  ) => {id: string; draft?: SanityDocument; published?: SanityDocument}[]
  export declare const getPublishedId: (str: string) => string
  export declare const getDraftId: (str: string) => string
  export declare const isDraftId: (str: string) => boolean
  export declare const isPublishedId: (str: string) => boolean
}

declare module 'part:@sanity/base/util/search-utils'
declare module 'part:@sanity/base/version-checker' {
  const VersionChecker: {
    checkVersions: () => Promise<{
      result: {
        outdated: {
          name: string
          latest: string
          severity: 'notice' | 'low' | 'medium' | 'high'
          version: string
        }[]
        isSupported: boolean
        isUpToDate: boolean
      }
    }>
  }
  export default VersionChecker
}

declare module 'part:@sanity/base/with-referring-documents'
