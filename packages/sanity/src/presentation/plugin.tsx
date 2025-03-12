import {type SanityDocument} from '@sanity/client'
import {lazy, Suspense} from 'react'
import {
  definePlugin,
  getPublishedId,
  getVersionFromId,
  type InputProps,
  isDocumentSchemaType,
} from 'sanity'

import {DEFAULT_TOOL_ICON, DEFAULT_TOOL_NAME, EDIT_INTENT_MODE} from './constants'
import {PresentationDocumentHeader} from './document/PresentationDocumentHeader'
import {PresentationDocumentProvider} from './document/PresentationDocumentProvider'
import {openInStructure} from './fieldActions/openInStructure'
import {getIntentState} from './getIntentState'
import {presentationUsEnglishLocaleBundle} from './i18n'
import {PresentationSpinner} from './PresentationSpinner'
import {router} from './router'
import {
  type DocumentLocationResolverObject,
  type DocumentLocationsState,
  type DocumentResolver,
  type PresentationPluginOptions,
} from './types'

const PresentationTool = lazy(() => import('./PresentationToolGrantsCheck'))
const BroadcastDisplayedDocument = lazy(() => import('./loader/BroadcastDisplayedDocument'))

/**
 * Define locations for a given document type.
 * This function doesn't do anything itself, it is used to provide type information.
 * @param resolver - resolver that return locations for a document.
 * @public
 */
export function defineLocations<K extends string>(
  resolver: DocumentLocationResolverObject<K> | DocumentLocationsState,
): typeof resolver {
  return resolver
}

/**
 * Define documents for a given location.
 * This function doesn't do anything itself, it is used to provide type information.
 * @param resolvers - resolvers that return documents.
 * @public
 */
export function defineDocuments(resolvers: DocumentResolver[]): typeof resolvers {
  return resolvers
}

/** @public */
export const presentationTool = definePlugin<PresentationPluginOptions>((options) => {
  const toolName = options.name || DEFAULT_TOOL_NAME

  if ('locate' in options) {
    // eslint-disable-next-line no-console
    console.warn('Presentation’s `locate` option is deprecated. Use `resolve.locations` instead.')
  }

  const hasLocationsResolver = !!(options.resolve?.locations || options.locate)

  function PresentationDocumentInput(props: InputProps) {
    const value = props.value as SanityDocument
    const documentId = value?._id ? getPublishedId(value?._id) : undefined
    const documentVersion = value?._id ? getVersionFromId(value._id) : undefined
    if (isDocumentSchemaType(props.schemaType)) {
      return (
        <PresentationDocumentProvider options={options}>
          {hasLocationsResolver && documentId && (
            <PresentationDocumentHeader
              documentId={documentId}
              version={documentVersion}
              options={options}
              schemaType={props.schemaType}
            />
          )}
          <Suspense fallback={<PresentationSpinner />}>{props.renderDefault(props)}</Suspense>
          <Suspense key="broadcast-displayed-document">
            <BroadcastDisplayedDocument key={documentId} value={value} />
          </Suspense>
        </PresentationDocumentProvider>
      )
    }

    return props.renderDefault(props)
  }

  function canHandleCreateIntent(params: Record<string, unknown>) {
    // We can't handle create intents without a `type` parameter
    if (!('type' in params)) {
      return false
    }

    if ('presentation' in params && params.presentation !== toolName) {
      return false
    }

    return 'template' in params ? {template: true} : true
  }

  function canHandleEditIntent(params: Record<string, unknown>) {
    // We can't handle edit intents without `type` or `id` parameters
    if (!('type' in params) || !('id' in params)) {
      return false
    }

    if ('presentation' in params && params.presentation !== toolName) {
      return false
    }

    return 'mode' in params ? {mode: params.mode === EDIT_INTENT_MODE} : true
  }

  return {
    i18n: {
      bundles: [presentationUsEnglishLocaleBundle],
    },
    document: {
      unstable_fieldActions: (prev) => {
        return [
          ...prev.filter((a) => a.name !== openInStructure.name), // prevent duplication
          openInStructure,
        ]
      },
    },

    form: {
      components: {
        input: PresentationDocumentInput,
      },
    },

    tools: [
      {
        icon: options.icon || DEFAULT_TOOL_ICON,
        name: toolName,
        title: options.title,
        component: PresentationTool,
        options,
        canHandleIntent(intent, params) {
          if (intent === 'create') return canHandleCreateIntent(params)
          if (intent === 'edit') return canHandleEditIntent(params)
          return false
        },
        getIntentState,
        router,
        __internalApplicationType: 'sanity/presentation',
      },
    ],
  }
})
