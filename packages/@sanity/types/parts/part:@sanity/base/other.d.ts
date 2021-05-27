declare module 'all:part:@sanity/base/absolutes' {
  const components: React.ComponentType[]
  export default components
}

declare module 'all:part:@sanity/base/component'

declare module 'all:part:@sanity/base/diff-resolver' {
  import type {ComponentType} from 'react'

  type DiffComponent = ComponentType<unknown>
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
    component?: React.ComponentType
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
declare module 'part:@sanity/base/authentication-fetcher'
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
  import type {Reference, SchemaType} from '@sanity/types'
  import type {Observable} from 'rxjs'

  declare const PreviewBase: React.ComponentType<{
    type?: SchemaType
    fields?: string[]
    value: any
    children?: (props: any) => React.ComponentType
    layout: 'inline' | 'block' | 'default' | 'card' | 'media'
  }>

  type previewObserver = (
    value: Reference | string,
    schemaType: SchemaType
  ) => Observable<{snapshot: {title: string}}>

  export const observeForPreview: previewObserver
  export const observePaths: (id: string, paths: string[]) => Observable<Record<string, string>>
  export default PreviewBase
  export {PreviewFields} from '@sanity/preview'
}

declare module 'part:@sanity/base/preview?' {
  import type {SchemaType} from '@sanity/types'
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
  import type {SchemaType} from '@sanity/types'

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

  declare const search: (queryStr: string) => Observable
  export default search
}

declare module 'part:@sanity/base/search/weighted'

declare module 'part:@sanity/base/settings' {
  declare const settings: {
    forNamespace: (
      namespaceKey: string
    ) => {
      forKey: (
        key: string
      ) => {
        listen: () => Observable<boolean>
        set: (val: boolean) => void
      }
    }
  }
  export default settings
}

declare module 'part:@sanity/base/tool'
declare module 'part:@sanity/base/user'
declare module 'part:@sanity/base/grants'
declare module 'part:@sanity/base/util/document-action-utils' {
  export const isActionEnabled: (schema: Schema, actionName: string) => boolean
}
declare module 'part:@sanity/base/util/draft-utils' {
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
