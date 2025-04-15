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
  type ConfigContext as ConfigContextType,
  type DocumentCommentsEnabledContext,
  type DocumentLanguageFilterComponent,
  type DocumentLayoutProps,
  type PluginOptions,
  type Tool,
} from './types'

type ConfigContext = ConfigContextType & {
  workspaceName: string
}

type RenderDefault = (props: any) => ReactNode
type DocumentCallbackContext = ConfigContext & {
  documentId?: string
  documentType: string
  /**
   * @deprecated use documentType instead
   */
  schemaType: string
  schema: SchemaType
  // Suggestion: Move releaseId and versionType to all the contexts
  releaseId?: string
  versionType?: 'published' | 'draft' | 'revision' | 'version'
}

type Config = {
  // ==== WorkspaceOptions extends SourceOptions ====
  basePath?: string
  subtitle?: string
  logo?: ComponentType
  icon?: ComponentType
  theme?: StudioTheme

  // Official plugins configs, require growth or above.
  features?: {
    tasks?: {enabled: boolean}
    releases?: {enabled: boolean}
    scheduledPublishing?: {
      enabled: boolean
      inputDateTimeFormat?: string
      showReleasesBanner?: boolean
    }
    comments?: {enabled: boolean | ((context: DocumentCommentsEnabledContext) => boolean)}
    mediaLibrary?: {
      enabled?: boolean
      libraryId?: string
    }
    announcements?: {
      enabled: boolean
    }
  }

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
    types?: SchemaTypeDefinition[] | ComposableOption<SchemaTypeDefinition[], ConfigContext>
    templates?: Template[] | ComposableOption<Template[], ConfigContext>
  }
  document?: {
    components?: {
      layout?: ComponentType<{
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
      | ComposableOption<DocumentBadgeComponent[], DocumentCallbackContext>
    actions?:
      | DocumentActionComponent[]
      | ComposableOption<DocumentActionComponent[], DocumentCallbackContext>
    fieldActions?:
      | DocumentFieldAction[]
      | ComposableOption<
          DocumentFieldAction[],
          Omit<DocumentCallbackContext, 'schemaType'> & {
            // This will be a breaking change if we change it to string, preserve it for now and tag as deprecated
            // @deprecated use schema instead
            schemaType: SchemaType
          }
        >
    inspectors?:
      | DocumentInspector[]
      | ComposableOption<DocumentInspector[], DocumentCallbackContext>
    productionUrl?: AsyncComposableOption<
      string | undefined,
      DocumentCallbackContext & {
        // This is the only one that takes a document.
        // @deprecated use documentId and documentType instead
        document: SanityDocumentLike
      }
    >
    /**
     * This is preserved as unstable, it is a implementation created for the i18n plugin
     * It renders in the DocumentPanelHeader, but it is used for more things than just the
     * plugin, ideally we will rename it to something that indicates it can be reused.
     */
    unstable_languageFilter?: ComposableOption<
      DocumentLanguageFilterComponent[],
      DocumentCallbackContext
    >
    newDocumentOptions?: ComposableOption<
      TemplateItem[],
      DocumentCallbackContext & {
        creationContext:
          | {type: 'global'; documentId?: undefined; schemaType?: undefined}
          | {type: 'document'; documentId: string; schemaType: string}
          | {type: 'structure'; documentId?: undefined; schemaType: string}
      }
    >
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
        actions: NavbarAction[]
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
    strategy?: 'groqLegacy' | 'groq2024'
    enableLegacySearch?: boolean
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
    search?: {
      partialIndexing?: {
        enabled: boolean
      }
    }
  }

  onUncaughtError?: (error: Error, errorInfo: ErrorInfo) => void
}
