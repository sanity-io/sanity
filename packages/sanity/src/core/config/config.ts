import {
  type AssetSource,
  type SanityDocumentLike,
  type SchemaType,
  type SchemaTypeDefinition,
} from '@sanity/types'
import {type ComponentType, type ErrorInfo, type ReactNode} from 'react'

import {type PreviewProps} from '../components/previews/types'
import {type BlockAnnotationProps, type BlockProps} from '../form/types/blockProps'
import {type FieldProps} from '../form/types/fieldProps'
import {type InputProps} from '../form/types/inputProps'
import {type ItemProps} from '../form/types/itemProps'
import {type LocalePluginOptions} from '../i18n/types'
import {type AuthStore} from '../store/_legacy/authStore/types'
import {type Template, type TemplateItem} from '../templates/types'
import {type StudioTheme} from '../theme/types'
import {type DocumentActionComponent} from './document/actions'
import {type DocumentBadgeComponent} from './document/badges'
import {type DocumentFieldAction} from './document/fieldActions/types'
import {type DocumentInspector} from './document/inspector'
import {type NavbarAction} from './studio/types'
import {
  type AssetSourceResolver,
  type AsyncComposableOption,
  type AuthConfig,
  type ComposableOption,
  type ConfigContext,
  type DocumentCommentsEnabledContext,
  type DocumentLanguageFilterComponent,
  type DocumentLayoutProps,
  type PluginOptions,
  type SourceOptions,
  type Tool,
} from './types'

type RenderDefault = (props: any) => ReactNode

type Config = {
  // ==== WorkspaceOptions extends SourceOptions ====
  basePath?: string
  subtitle?: string
  logo?: ComponentType
  icon?: ComponentType
  theme?: StudioTheme
  // TODO: Why is this here? It seems internal implementation details are leaking into user land.
  unstable_sources?: SourceOptions[]

  // Official plugins configs -
  // Suggestion: wrap under `features`?
  // Suggestion: add a callback exposing the config context to the official plugins
  unstable_tasks?: {enabled: boolean} // @deprecated
  tasks?: {enabled: boolean}
  releases?: {enabled: boolean}
  scheduledPublishing?: {
    enabled: boolean
    inputDateTimeFormat?: string
    __internal__workspaceEnabled?: boolean // This shouldn't be exposed to users, it's an internal implementation detail.
    showReleasesBanner?: boolean
  }
  // Suggestion: Comments is a plugin which missing from here, maybe it should be part of the `config` rather than in the DocumentOptions.

  // Suggestion: Move this behind `beta` or deprecate it, it's on by default now.
  __internal_serverDocumentActions?: {enabled: boolean}

  // ==== SourceOptions extends PluginOptions ====
  title?: string
  projectId: string
  dataset: string
  apiHost?: string
  auth?: AuthConfig | AuthStore

  // ==== PluginOptions ====
  name: string
  plugins?: PluginOptions[]
  schema?: {
    name?: string
    types?:
      | SchemaTypeDefinition[]
      | ComposableOption<SchemaTypeDefinition[], {projectId: string; dataset: string}> // Suggestion: Make this ConfigContext
    templates?: Template[] | ComposableOption<Template[], ConfigContext>
  }
  document?: {
    components?: {
      // Suggestion: rename to layout
      unstable_layout?: ComponentType<{
        documentId: string
        documentType: string
        renderDefault: (props: DocumentLayoutProps) => React.JSX.Element
      }>
    }

    // Suggestion: When composable options are available, remove the Array option, given that it's easy
    // to make a mistake and pass an array instead of a composable option, removing the previous ones without noticing.
    // This context are similar but different, would be great to have a single type for this.
    badges?:
      | DocumentBadgeComponent[]
      | ComposableOption<
          DocumentBadgeComponent[],
          // DocumentBadgesContext
          ConfigContext & {documentId?: string; schemaType: string}
        >
    actions?:
      | DocumentActionComponent[]
      | ComposableOption<
          DocumentActionComponent[],
          // DocumentActionsContext
          ConfigContext & {
            documentId?: string
            schemaType: string // Here schema type is an string and below is a SchemaType
            // Suggestion: Move releaseId and versionType to all the contexts
            releaseId?: string
            versionType?: 'published' | 'draft' | 'revision' | 'version'
          }
        >
    unstable_fieldActions?:
      | DocumentFieldAction[]
      | ComposableOption<
          DocumentFieldAction[],
          // DocumentFieldActionsResolverContext
          ConfigContext & {
            documentId: string
            documentType: string
            schemaType: SchemaType
          }
        >
    inspectors?:
      | DocumentInspector[]
      | ComposableOption<
          DocumentInspector[],
          //   DocumentInspectorContext
          ConfigContext & {
            documentId?: string
            documentType: string
          }
        >
    productionUrl?: AsyncComposableOption<
      string | undefined,
      //  ResolveProductionUrlContext
      ConfigContext & {
        document: SanityDocumentLike // This is the only one that takes a document, rest use id and type.
      }
    >
    unstable_languageFilter?: ComposableOption<
      DocumentLanguageFilterComponent[],
      // DocumentLanguageFilterContext
      ConfigContext & {
        documentId?: string
        schemaType: string
      }
    >
    newDocumentOptions?: ComposableOption<
      TemplateItem[],
      ConfigContext & {
        creationContext:
          | {type: 'global'; documentId?: undefined; schemaType?: undefined}
          | {type: 'document'; documentId: string; schemaType: string}
          | {type: 'structure'; documentId?: undefined; schemaType: string}
      }
    >

    // Suggestion: Move this to the root? With the rest of official plugins?
    unstable_comments?: {enabled: boolean | ((context: DocumentCommentsEnabledContext) => boolean)} // @deprecated
    comments?: {enabled: boolean | ((context: DocumentCommentsEnabledContext) => boolean)}
  }
  form?: {
    // SanityFormConfig
    unstable?: {
      CustomMarkers?: ComponentType
      Markers?: ComponentType
    }
    components?: {
      // FormComponents
      annotation?: ComponentType<BlockAnnotationProps>
      block?: ComponentType<BlockProps>
      field?: ComponentType<FieldProps>
      inlineBlock?: ComponentType<BlockProps>
      input?: ComponentType<InputProps>
      item?: ComponentType<ItemProps>
      preview?: ComponentType<PreviewProps>
    }
    file?: {
      assetSources?: AssetSource[] | AssetSourceResolver
      directUploads?: boolean
    }
    image?: {
      assetSources?: AssetSource[] | AssetSourceResolver
      directUploads?: boolean
    }
  }

  studio?: {
    components?: {
      activeToolLayout: ComponentType<{
        renderDefault: RenderDefault
        activeTool: Tool
      }>
      layout: ComponentType<{
        renderDefault: RenderDefault
      }>
      logo: ComponentType<{
        renderDefault: RenderDefault
        title: string
      }>
      navbar: ComponentType<{
        __internal_actions: NavbarAction[]
        title: string
      }>
      toolMenu: ComponentType<{
        activeToolName: string
        closeSidebar: () => void
        context: 'sidebar' | 'topbar'
        isSidebarOpen: boolean
        tools: Tool[]
        renderDefault: RenderDefault
      }>
    }
  }

  i18n?: LocalePluginOptions
  tools?: Tool[] | ComposableOption<Tool[], ConfigContext>

  // Suggestion: Move to workspaceOptions?
  search?: {
    unstable_partialIndexing?: {
      enabled: boolean
    }
    strategy?: 'groqLegacy' | 'groq2024'
    enableLegacySearch?: boolean
  }

  mediaLibrary?: {
    enabled?: boolean
    libraryId?: string
  }

  // Suggestion: Move to workspaceOptions?
  beta?: {
    treeArrayEditing?: {enabled: boolean} // @deprecated, remove this.
    create?: {
      startInCreateEnabled: boolean
      fallbackStudioOrigin?: string
    }
    eventsAPI?: {
      documents?: boolean
      releases?: boolean
    }
  }
  // Suggestion: Move to workspaceOptions?
  announcements?: {
    enabled: boolean
  }

  onUncaughtError?: (error: Error, errorInfo: ErrorInfo) => void

  // this is strictly internal, remove it if possible and hardcode it into the studio
  __internal_tasks?: {
    footerAction: ReactNode
  }
}
